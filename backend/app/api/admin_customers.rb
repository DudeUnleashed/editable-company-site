require_relative "entities/customer_entity"
require_relative "entities/service_request_entity"

class AdminCustomers < Grape::API
  namespace :admin do
    resource :customers do
      before { admin_only! }

      desc "List all customers with pagination"
      params do
        optional :search, type: String, desc: "Search by name, email, or phone"
        optional :page, type: Integer, default: 1, desc: "Page number"
        optional :per_page, type: Integer, default: 25, desc: "Items per page (max 100)"
      end
      get do
        validate_page_params

        customers = Customer.recently_created

        if params[:search].present?
          term = "%#{params[:search]}%"
          customers = customers.where("name ILIKE ? OR email ILIKE ? OR phone ILIKE ?", term, term, term)
        end

        result = paginate(customers, page: params[:page], items: params[:per_page])

        {
          customers: CustomerEntity.represent(result[:data]),
          pagination: result[:pagination]
        }
      end

      desc "Get a single customer with their service requests"
      params do
        requires :id, type: Integer, desc: "Customer ID"
      end
      get ':id' do
        customer = Customer.find(params[:id])
        requests = customer.service_requests.includes(:service).order(created_at: :desc)

        {
          customer: CustomerEntity.represent(customer),
          service_requests: ServiceRequestEntity.represent(requests),
          stats: {
            total_requests: requests.count,
            total_jobs: requests.where(status: %w[scheduled in_progress completed cancelled]).count,
            completed_jobs: requests.where(status: 'completed').count,
            total_spent: requests.where(status: 'completed').sum(:quoted_price).to_f
          }
        }
      end

      desc "Update a customer's details"
      params do
        requires :id, type: Integer, desc: "Customer ID"
        optional :name, type: String, desc: "Customer name"
        optional :email, type: String, desc: "Customer email"
        optional :phone, type: String, desc: "Customer phone"
        optional :notes, type: String, desc: "Admin notes about the customer"
        optional :suggested_next_services, type: String, desc: "Suggested next services for invoicing"
      end
      put ':id' do
        customer = Customer.find(params[:id])

        update_params = declared(params, include_missing: false).except(:id)
        before = customer.attributes.slice(*update_params.keys.map(&:to_s))

        if customer.update(update_params)
          log_audit(action: 'customer_update', resource: customer, details: { before: before, after: update_params })
          present customer, with: CustomerEntity
        else
          error!({ error: "Update failed", details: customer.errors.full_messages }, 422)
        end
      end

      desc "Reassign all service requests from one customer to another"
      params do
        requires :id, type: Integer, desc: "Source customer ID"
        requires :target_customer_id, type: Integer, desc: "Target customer ID to receive the service requests"
      end
      post ':id/reassign' do
        source = Customer.find(params[:id])
        target = Customer.find(params[:target_customer_id])

        error!({ error: "Cannot reassign to the same customer" }, 422) if source.id == target.id

        count = source.service_requests.count
        source.service_requests.update_all(customer_id: target.id)

        log_audit(action: 'customer_reassign', resource: source, details: {
          target_customer_id: target.id,
          target_customer_name: target.name,
          requests_moved: count
        })

        { success: true, moved: count, target: CustomerEntity.represent(target) }
      end

      desc "Delete a customer and all their data"
      params do
        requires :id, type: Integer, desc: "Customer ID"
      end
      delete ':id' do
        customer = Customer.find(params[:id])

        if customer.service_requests.exists?
          error!({ error: "Cannot delete customer with existing service requests. Reassign or delete them first." }, 422)
        end

        snapshot = customer.attributes
        log_audit(action: 'customer_delete', resource: customer, details: { snapshot: snapshot })

        customer.destroy!
        { success: true }
      end
    end
  end
end
