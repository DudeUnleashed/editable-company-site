require_relative "entities/service_request_entity"

class AdminQuotes < Grape::API
  resource :quotes do
    desc "List all service requests (admin view) with pagination" do
      detail "Returns paginated service requests with user and service details for admin dashboard"
      success [ServiceRequestEntity]
    end
    params do
      optional :status, type: String, values: ServiceRequest.statuses.keys, desc: "Filter by status"
      optional :from_date, type: Date, desc: "Filter requests from this date"
      optional :to_date, type: Date, desc: "Filter requests until this date"
      optional :page, type: Integer, default: 1, desc: "Page number (starts at 1)"
      optional :per_page, type: Integer, default: 25, desc: "Items per page (max 100)"
    end
    get do
      # Require admin authentication
      admin_only!

      # Validate pagination params
      validate_page_params

      # Eager load associations to avoid N+1 queries
      requests = ServiceRequest.includes(:customer, :service).order(created_at: :desc)

      # Add filtering
      requests = requests.where(status: params[:status]) if params[:status]
      requests = requests.where('created_at >= ?', params[:from_date]) if params[:from_date]
      requests = requests.where('created_at <= ?', params[:to_date]) if params[:to_date]

      # Paginate results
      result = paginate(requests, page: params[:page], items: params[:per_page])

      # Return data with pagination metadata
      {
        requests: ServiceRequestEntity.represent(result[:data]),
        pagination: result[:pagination]
      }
    end

    desc "Convert a quote (pending/accepted) into a scheduled job" do
      detail "Takes quote and adds job-specific fields (price, schedule, etc.). Changes status to 'scheduled'."
      success ServiceRequestEntity
    end
    params do
      requires :id, type: Integer, desc: "Quote/Request ID to convert"
      requires :quoted_price, type: BigDecimal, desc: "Admin's quoted price for the job"
      requires :scheduled_start, type: DateTime, desc: "When the job should start"
      optional :scheduled_end, type: DateTime, desc: "When the job should end (calculated from duration if not provided)"
      optional :estimated_duration_minutes, type: Integer, desc: "Expected duration in minutes"
      optional :admin_notes, type: String, desc: "Internal notes (not visible to customer)"
      optional :assigned_technician, type: String, desc: "Who will perform the work"
    end
    post ':id/convert_to_job' do
      # Require admin authentication
      admin_only!

      request = ServiceRequest.find(params[:id])

      # Validate that this is a quote that can be converted
      unless request.pending? || request.accepted?
        error!({ error: 'Cannot convert', message: 'Only pending or accepted quotes can be converted to jobs' }, 400)
      end

      # Convert to job
      begin
        request.convert_to_job!(
          quoted_price: params[:quoted_price],
          scheduled_start: params[:scheduled_start],
          scheduled_end: params[:scheduled_end],
          estimated_duration_minutes: params[:estimated_duration_minutes],
          admin_notes: params[:admin_notes],
          assigned_technician: params[:assigned_technician]
        )

        log_audit(action: 'convert_to_job', resource: request, details: { quoted_price: params[:quoted_price].to_f, scheduled_start: params[:scheduled_start].to_s })
        present request, with: ServiceRequestEntity
      rescue => e
        error!({ error: 'Conversion failed', message: e.message }, 422)
      end
    end

  end
end