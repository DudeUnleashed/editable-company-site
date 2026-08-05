require_relative "entities/service_request_entity"

class Requests < Grape::API
  resource :requests do
    desc "Create a new service request" do
      detail "Public endpoint - allows customers to submit service quote requests"
      success ServiceRequestEntity
    end
    params do
      requires :name, type: String, desc: "Customer full name"
      requires :email, type: String, desc: "Customer email address"
      optional :phone, type: String, desc: "Customer phone number"
      optional :service, type: String, desc: "Service name"
      optional :rego_or_vin, type: String, desc: "Vehicle registration or VIN"
      optional :car_type, type: String, desc: "Vehicle make and model"
      optional :last_serviced, type: Date, desc: "Date vehicle was last serviced"
      optional :notes, type: String, desc: "Additional notes or requirements"
      optional :preferred_contact, type: String, desc: "Preferred contact method (email/phone)"
      optional :returningCustomer, type: String, desc: "Whether customer has used service before (yes/no)"
    end
    post do
      existing = Customer.find_by(email: params[:email])

      if existing
        customer = existing
        conflicts = []

        if params[:name].present? && params[:name] != customer.name
          conflicts << "name: #{params[:name]}"
          customer.name = params[:name] if customer.name.blank?
        end
        if params[:phone].present? && params[:phone] != customer.phone
          conflicts << "phone: #{params[:phone]}"
          customer.phone = params[:phone] if customer.phone.blank?
        end

        if conflicts.any?
          timestamp = Time.current.strftime("%d/%m/%Y %I:%M %p")
          conflict_note = "[#{timestamp}] Customer submitted a service request with different details — #{conflicts.join(', ')}"
          customer.notes = [customer.notes.presence, conflict_note].compact.join("\n")
        end

        customer.save! if customer.changed?
      else
        customer = Customer.create!(
          name: params[:name],
          email: params[:email],
          phone: params[:phone]
        )
      end

      # Find the requested service
      service = Service.find_by(name: params[:service])
      error!({ error: "Service not found" }, 404) unless service

      # Create the service request
      # Using create! to raise exception on validation failure (caught by Base error handler)
      request = ServiceRequest.create!(
        customer: customer,
        service: service,
        car_type: params[:car_type],
        rego_or_vin: params[:rego_or_vin],
        last_serviced_on: params[:last_serviced],
        notes: params[:notes],
        preferred_contact_method: params[:preferred_contact],
        returning_customer: params[:returningCustomer] == 'yes'
      )

      present request, with: ServiceRequestEntity
    end

    # NOTE: This endpoint is deprecated in favor of /api/quotes
    # Use GET /api/quotes for paginated, filtered admin view with better performance
    desc "List all service requests (deprecated - use /api/quotes)" do
      detail "Lists all service requests with user and service details. Use /api/quotes for pagination and filtering."
      success [ServiceRequestEntity]
    end
    get do
      # Require admin authentication
      admin_only!

      # Eager load associations to avoid N+1 queries
      requests = ServiceRequest.includes(:customer, :service).order(created_at: :desc)

      present requests, with: ServiceRequestEntity
    end

    desc "Update a service request" do
      detail "Update request status (typically used by admin to accept/reject quotes)"
      success ServiceRequestEntity
    end
    params do
      requires :id, type: Integer, desc: "Request ID"
      optional :status, type: String,
               values: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
               desc: "Request status"
      optional :admin_notes, type: String, desc: "Internal admin notes"
      optional :quoted_price, type: BigDecimal, desc: "Quoted price"
      optional :scheduled_start, type: DateTime, desc: "Job start time"
      optional :scheduled_end, type: DateTime, desc: "Job end time"
      optional :estimated_duration_minutes, type: Integer, desc: "Duration in minutes"
      optional :assigned_technician, type: String, desc: "Assigned technician"
      optional :car_type, type: String, desc: "Vehicle make and model"
      optional :rego_or_vin, type: String, desc: "Registration or VIN"
    end
    put ':id' do
      # Require admin authentication
      admin_only!

      # Find the request (raises RecordNotFound if not exists - handled by Base)
      request = ServiceRequest.find(params[:id])

      update_params = declared(params, include_missing: false).except(:id)
      before = request.attributes.slice(*update_params.keys.map(&:to_s))
      if request.update(update_params)
        log_audit(action: 'request_update', resource: request, details: { before: before, after: update_params })
        present request, with: ServiceRequestEntity
      else
        error!({ error: "Update failed", details: request.errors.full_messages }, 422)
      end
    end

    desc "Delete a service request"
    params do
      requires :id, type: Integer, desc: "Request ID"
    end
    delete ':id' do
      admin_only!

      request = ServiceRequest.includes(:customer, :service).find(params[:id])
      snapshot = request.attributes.merge(
        customer_name: request.customer&.name,
        customer_email: request.customer&.email,
        service_name: request.service&.name
      )
      log_audit(action: 'request_delete', resource: request, details: { snapshot: snapshot })
      request.destroy!
      { message: "Service request deleted" }
    end

    desc "Send completion email to customer"
    params do
      requires :id, type: Integer, desc: "Request ID"
    end
    post ':id/send_completion_email' do
      admin_only!

      request = ServiceRequest.find(params[:id])

      begin
        request.send_completion_email!
        log_audit(action: 'send_completion_email', resource: request)
        present request, with: ServiceRequestEntity
      rescue => e
        error!({ error: e.message }, 422)
      end
    end
  end
end