require_relative "entities/service_request_entity"

class AdminCalendar < Grape::API
  namespace :admin do
    resource :calendar do
      desc "Get scheduled jobs for calendar display" do
        detail "Returns only jobs (not quotes) that have scheduled dates. Includes in_progress and completed jobs for context."
        success [ServiceRequestEntity]
      end
      params do
        optional :start_date, type: DateTime, desc: "Filter jobs starting from this date"
        optional :end_date, type: DateTime, desc: "Filter jobs ending before this date"
        optional :status, type: Array[String], desc: "Filter by status (scheduled, in_progress, completed)"
      end
      get do
        # Require admin authentication
        admin_only!

        # Start with jobs only (exclude quotes)
        jobs = ServiceRequest.calendar_events.includes(:customer, :service)

        # Apply date range filtering if provided
        if params[:start_date] && params[:end_date]
          jobs = jobs.in_date_range(params[:start_date], params[:end_date])
        end

        # Apply status filtering if provided
        if params[:status].present?
          jobs = jobs.where(status: params[:status])
        end

        present jobs, with: ServiceRequestEntity
      end

      desc "Reschedule a job to a new date/time" do
        detail "Updates scheduled_start and optionally scheduled_end for drag-and-drop calendar functionality"
        success ServiceRequestEntity
      end
      params do
        requires :id, type: Integer, desc: "Job ID"
        requires :scheduled_start, type: DateTime, desc: "New start date/time"
        optional :scheduled_end, type: DateTime, desc: "New end date/time (will be calculated from duration if not provided)"
      end
      put ':id/reschedule' do
        # Require admin authentication
        admin_only!

        job = ServiceRequest.find(params[:id])

        # Validate this is actually a job, not a quote
        unless job.is_job?
          error!({ error: 'Cannot reschedule quotes', message: 'Only scheduled jobs can be rescheduled' }, 400)
        end

        # Reschedule the job
        before = { scheduled_start: job.scheduled_start, scheduled_end: job.scheduled_end }
        begin
          job.reschedule!(params[:scheduled_start], params[:scheduled_end])
          log_audit(action: 'job_reschedule', resource: job, details: { before: before, after: { scheduled_start: params[:scheduled_start].to_s, scheduled_end: params[:scheduled_end]&.to_s } })
          present job, with: ServiceRequestEntity
        rescue => e
          error!({ error: 'Rescheduling failed', message: e.message }, 422)
        end
      end
    end
  end
end