require 'google/apis/calendar_v3'
require 'googleauth'

class GoogleCalendarService
  CalendarApi = Google::Apis::CalendarV3

  def initialize(settings)
    @settings = settings
    @service = CalendarApi::CalendarService.new
    @service.authorization = build_credentials
  end

  def create_event(service_request)
    event = build_event(service_request)
    result = @service.insert_event(@settings.calendar_id || 'primary', event)
    service_request.update_column(:google_event_id, result.id)
    result.id
  end

  def update_event(service_request)
    return unless service_request.google_event_id.present?
    event = build_event(service_request)
    @service.update_event(
      @settings.calendar_id || 'primary',
      service_request.google_event_id,
      event
    )
  end

  def delete_event(service_request)
    return unless service_request.google_event_id.present?
    @service.delete_event(
      @settings.calendar_id || 'primary',
      service_request.google_event_id
    )
    service_request.update_column(:google_event_id, nil)
  rescue Google::Apis::ClientError => e
    Rails.logger.warn("Google Calendar event not found for deletion: #{e.message}")
  end

  def sync_all_jobs
    jobs = ServiceRequest.jobs_only.where(google_event_id: nil).where.not(scheduled_start: nil)
    synced = 0
    jobs.find_each do |job|
      create_event(job)
      synced += 1
    rescue => e
      Rails.logger.error("Failed to sync job #{job.id}: #{e.message}")
    end
    @settings.update(last_synced_at: Time.current)
    synced
  end

  def self.auth_url
    client_id = Google::Auth::ClientId.new(
      ENV['GOOGLE_CLIENT_ID'],
      ENV['GOOGLE_CLIENT_SECRET']
    )
    authorizer = Google::Auth::UserAuthorizer.new(client_id, CalendarApi::AUTH_CALENDAR, nil)

    state = SecureRandom.hex(32)
    Rails.cache.write("oauth_state:#{state}", true, expires_in: 10.minutes)

    authorizer.get_authorization_url(base_url: ENV['GOOGLE_REDIRECT_URI'], state: state)
  end

  def self.validate_state!(state)
    raise "Missing OAuth state parameter" if state.blank?
    cache_key = "oauth_state:#{state}"
    raise "Invalid or expired OAuth state" unless Rails.cache.read(cache_key)
    Rails.cache.delete(cache_key)
  end

  def self.exchange_code(code)
    client_id = Google::Auth::ClientId.new(
      ENV['GOOGLE_CLIENT_ID'],
      ENV['GOOGLE_CLIENT_SECRET']
    )
    authorizer = Google::Auth::UserAuthorizer.new(client_id, CalendarApi::AUTH_CALENDAR, nil)
    credentials = authorizer.get_credentials_from_code(
      code: code,
      base_url: ENV['GOOGLE_REDIRECT_URI']
    )
    {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      expires_at: credentials.expires_at
    }
  end

  private

  def build_credentials
    refresh_token_if_needed!

    Google::Auth::UserRefreshCredentials.new(
      client_id: ENV['GOOGLE_CLIENT_ID'],
      client_secret: ENV['GOOGLE_CLIENT_SECRET'],
      refresh_token: @settings.refresh_token,
      access_token: @settings.access_token,
      expires_at: @settings.expires_at,
      scope: CalendarApi::AUTH_CALENDAR
    )
  end

  def refresh_token_if_needed!
    return unless @settings.token_expired?
    return unless @settings.refresh_token.present?

    credentials = Google::Auth::UserRefreshCredentials.new(
      client_id: ENV['GOOGLE_CLIENT_ID'],
      client_secret: ENV['GOOGLE_CLIENT_SECRET'],
      refresh_token: @settings.refresh_token,
      scope: CalendarApi::AUTH_CALENDAR
    )
    credentials.fetch_access_token!

    @settings.update!(
      access_token: credentials.access_token,
      expires_at: Time.current + credentials.expires_in.to_i.seconds
    )
  end

  def build_event(service_request)
    summary = [
      service_request.service&.name,
      "-",
      service_request.customer&.name,
      service_request.car_type.present? ? "(#{service_request.car_type})" : nil
    ].compact.join(" ")

    description_parts = []
    description_parts << "Customer: #{service_request.customer&.name}"
    description_parts << "Email: #{service_request.customer&.email}"
    description_parts << "Phone: #{service_request.customer&.phone}" if service_request.customer&.phone.present?
    description_parts << "Vehicle: #{service_request.car_type}" if service_request.car_type.present?
    description_parts << "Rego: #{service_request.rego_or_vin}" if service_request.rego_or_vin.present?
    description_parts << "Quoted: $#{service_request.quoted_price}" if service_request.quoted_price.present?
    description_parts << "Technician: #{service_request.assigned_technician}" if service_request.assigned_technician.present?
    description_parts << ""
    description_parts << "Notes: #{service_request.admin_notes}" if service_request.admin_notes.present?
    description_parts << "Customer Notes: #{service_request.notes}" if service_request.notes.present?

    event = CalendarApi::Event.new(
      summary: summary,
      description: description_parts.join("\n"),
      start: CalendarApi::EventDateTime.new(
        date_time: service_request.scheduled_start.iso8601,
        time_zone: 'Australia/Sydney'
      ),
      end: CalendarApi::EventDateTime.new(
        date_time: (service_request.scheduled_end || service_request.scheduled_start + 1.hour).iso8601,
        time_zone: 'Australia/Sydney'
      )
    )

    color_id = case service_request.status
               when 'scheduled' then '9'   # Blueberry
               when 'in_progress' then '6' # Tangerine
               when 'completed' then '10'  # Sage
               else nil
               end
    event.color_id = color_id if color_id

    event
  end
end
