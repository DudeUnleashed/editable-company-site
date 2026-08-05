class Base < Grape::API
  prefix 'api'
  format :json

  rescue_from ActiveRecord::RecordNotFound do |e|
    error!({ error: 'Record not found' }, 404)
  end

  rescue_from ActiveRecord::RecordInvalid do |e|
    error!({ error: 'Validation failed', message: e.message, details: e.record.errors }, 422)
  end

  rescue_from :all do |e|
    Rails.logger.error("API Error: #{e.class} - #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))

    client_message = Rails.env.production? ? 'Internal server error' : e.message
    error!({ error: 'Internal server error', message: client_message }, 500)
  end

  helpers CookieAuth
  helpers do
    include PaginationHelper

    def current_user
      return @current_user if @current_user

      # Cookie-based auth (primary)
      token = cookies[:access_token]

      # Fall back to Authorization header (dev tools, transition)
      unless token
        auth_header = headers['Authorization']
        token = auth_header.split(' ').last if auth_header
      end

      if token
        decoded = JsonWebToken.decode(token)
        @current_user = User.find_by(id: decoded[:user_id]) if decoded
      end

      @current_user
    end

    def authenticate!
      error!({ error: 'Unauthorized - Please login' }, 401) unless current_user
    end

    def admin_only!
      authenticate!
      error!({ error: 'Forbidden - Admin access required' }, 403) unless current_user.admin?
    end

    def log_audit(action:, resource: nil, details: {})
      AuditLog.log(
        action: action,
        user: current_user,
        resource: resource,
        details: details,
        request: request
      )
    end
  end

  mount Auth
  mount Requests
  mount Users
  mount Services
  mount AdminDashboard
  mount AdminCustomers
  mount AdminQuotes
  mount AdminCalendar
  mount ContentBlocks
  mount AdminReviews
  mount Gallery
  mount GoogleCalendarApi
end
