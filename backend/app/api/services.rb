require_relative "entities/service_entity"

class Services < Grape::API
  format :json

  resource :services do
    desc "List all available services" do
      detail "Returns list of all automotive services offered with pricing. Filter by active, category."
      success [ServiceEntity]
    end
    params do
      optional :active_only, type: Boolean, desc: "Filter to only active services"
      optional :category, type: String, desc: "Filter by category"
    end
    get do
      # Fetch all services (ordered by name via default scope in model)
      services = Service.all

      # Apply filters
      services = services.active if params[:active_only]
      services = services.by_category(params[:category]) if params[:category].present?

      present services, with: ServiceEntity
    end

    desc "Create a new service (admin only)" do
      detail "Creates a new automotive service with pricing and details"
      success ServiceEntity
    end
    params do
      requires :name, type: String, desc: "Service name"
      optional :description, type: String, desc: "Service description"
      optional :detailed_description, type: String, desc: "Detailed description for services page"
      optional :base_price, type: Float, desc: "Base price in dollars"
      optional :estimated_duration, type: Integer, desc: "Duration in minutes"
      optional :category, type: String, desc: "Service category", values: %w[maintenance repair diagnostic inspection bodywork other general]
      optional :active, type: Boolean, desc: "Whether service is active", default: true
    end
    post do
      admin_only!

      service = Service.create!(declared(params, include_missing: false))
      log_audit(action: 'service_create', resource: service)
      present service, with: ServiceEntity
    end

    desc "Update a service (admin only)" do
      detail "Updates an existing service's details and pricing"
      success ServiceEntity
    end
    params do
      requires :id, type: Integer, desc: "Service ID"
      optional :name, type: String, desc: "Service name"
      optional :description, type: String, desc: "Service description"
      optional :detailed_description, type: String, desc: "Detailed description for services page"
      optional :base_price, type: Float, desc: "Base price in dollars"
      optional :estimated_duration, type: Integer, desc: "Duration in minutes"
      optional :category, type: String, desc: "Service category", values: %w[maintenance repair diagnostic inspection bodywork other general]
      optional :active, type: Boolean, desc: "Whether service is active"
    end
    put ':id' do
      admin_only!

      service = Service.find(params[:id])
      update_params = declared(params, include_missing: false).except(:id)
      before = service.attributes.slice(*update_params.keys.map(&:to_s))
      service.update!(update_params)
      log_audit(action: 'service_update', resource: service, details: { before: before, after: update_params })
      present service, with: ServiceEntity
    end

    desc "Upload service image"
    params do
      requires :id, type: Integer, desc: "Service ID"
      requires :image, type: File, desc: "Service image file"
    end
    post ':id/image' do
      admin_only!

      service = Service.find(params[:id])
      file = params[:image]
      tempfile = file.respond_to?(:tempfile) ? file.tempfile : file[:tempfile]
      filename = file.respond_to?(:original_filename) ? file.original_filename : file[:filename]
      content_type = file.respond_to?(:content_type) ? file.content_type : file[:type]
      tempfile.rewind if tempfile.respond_to?(:rewind)

      service.service_image.attach(io: tempfile, filename: filename, content_type: content_type)
      log_audit(action: 'service_image_upload', resource: service)
      present service, with: ServiceEntity
    end

    desc "Remove service image"
    params do
      requires :id, type: Integer, desc: "Service ID"
    end
    delete ':id/image' do
      admin_only!

      service = Service.find(params[:id])
      if service.service_image.attached?
        service.service_image.purge
        log_audit(action: 'service_image_delete', resource: service)
      end
      present service, with: ServiceEntity
    end

    desc "Delete a service (admin only)" do
      detail "Deletes a service. WARNING: This will fail if service has associated requests."
    end
    params do
      requires :id, type: Integer, desc: "Service ID"
    end
    delete ':id' do
      admin_only!

      service = Service.find(params[:id])

      # Check if service has associated requests
      if service.service_requests.exists?
        error!({ error: "Cannot delete service with existing requests. Consider marking as inactive instead." }, 422)
      end

      snapshot = service.attributes
      log_audit(action: 'service_delete', resource: service, details: { snapshot: snapshot })
      service.destroy!
      { success: true, message: "Service deleted successfully" }
    end
  end
end