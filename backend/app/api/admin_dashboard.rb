class AdminDashboard < Grape::API
  namespace :admin do
    resource :dashboard do
      before { admin_only! }

      desc "Get dashboard statistics"
      get do
        today_start = Time.current.beginning_of_day
        today_end = Time.current.end_of_day
        week_start = Time.current.beginning_of_week
        week_end = Time.current.end_of_week

        todays_jobs = ServiceRequest.jobs_only.where(scheduled_start: today_start..today_end)
        week_jobs = ServiceRequest.jobs_only.where(scheduled_start: week_start..week_end)
          .where.not(status: 'completed')

        pending_quotes = ServiceRequest.where(status: %w[pending accepted])

        completed_jobs = ServiceRequest.where(status: 'completed')
        total_revenue = completed_jobs.sum(:quoted_price).to_f

        recent = ServiceRequest.includes(:customer, :service)
          .order(updated_at: :desc)
          .limit(5)

        {
          jobs_today: {
            total: todays_jobs.count,
            completed: todays_jobs.where(status: 'completed').count,
            in_progress: todays_jobs.where(status: 'in_progress').count,
            scheduled: todays_jobs.where(status: 'scheduled').count,
          },
          active_jobs_this_week: week_jobs.count,
          pending_quotes: pending_quotes.count,
          total_revenue: total_revenue,
          recent_activity: recent.map { |r|
            {
              id: r.id,
              status: r.status,
              customer_name: r.customer&.name,
              service_name: r.service&.name || "Custom Service",
              updated_at: r.updated_at,
            }
          }
        }
      end
    end
  end
end
