class GoogleCalendarApi < Grape::API
  format :json

  namespace :admin do
    before { admin_only! }

    namespace 'google-calendar' do
      desc "Get Google OAuth authorization URL"
      get 'auth-url' do
        unless ENV['GOOGLE_CLIENT_ID'].present? && ENV['GOOGLE_CLIENT_SECRET'].present?
          error!({ error: 'Google Calendar credentials not configured' }, 422)
        end
        { url: GoogleCalendarService.auth_url }
      end

      desc "Exchange OAuth code for tokens"
      params do
        requires :code, type: String, desc: "Authorization code from Google"
        requires :state, type: String, desc: "OAuth state parameter for CSRF protection"
      end
      post 'callback' do
        begin
          GoogleCalendarService.validate_state!(params[:state])
        rescue => e
          error!({ error: e.message }, 403)
        end

        tokens = GoogleCalendarService.exchange_code(params[:code])

        setting = GoogleCalendarSetting.find_or_initialize_by(user: current_user)
        setting.update!(
          access_token: tokens[:access_token],
          refresh_token: tokens[:refresh_token],
          expires_at: tokens[:expires_at],
          sync_enabled: true
        )

        log_audit(action: 'google_calendar_connect', resource: setting)
        { success: true, message: 'Google Calendar connected' }
      end

      desc "Get Google Calendar connection status"
      get 'status' do
        setting = GoogleCalendarSetting.current
        if setting
          {
            connected: true,
            sync_enabled: setting.sync_enabled,
            calendar_id: setting.calendar_id,
            last_synced_at: setting.last_synced_at,
            token_expired: setting.token_expired?
          }
        else
          { connected: false }
        end
      end

      desc "Disconnect Google Calendar"
      post 'disconnect' do
        setting = GoogleCalendarSetting.current
        error!({ error: 'Not connected' }, 404) unless setting
        log_audit(action: 'google_calendar_disconnect')
        setting.destroy!
        { success: true, message: 'Google Calendar disconnected' }
      end

      desc "Sync all unsynced jobs to Google Calendar"
      post 'sync' do
        setting = GoogleCalendarSetting.current
        error!({ error: 'Google Calendar not connected' }, 422) unless setting
        error!({ error: 'Sync is disabled' }, 422) unless setting.sync_enabled

        service = GoogleCalendarService.new(setting)
        synced = service.sync_all_jobs

        log_audit(action: 'google_calendar_sync', details: { synced_count: synced })
        { success: true, synced_count: synced, message: "#{synced} jobs synced" }
      end

      desc "Update sync settings"
      params do
        optional :sync_enabled, type: Boolean
        optional :calendar_id, type: String
      end
      put 'settings' do
        setting = GoogleCalendarSetting.current
        error!({ error: 'Not connected' }, 404) unless setting
        setting.update!(declared(params, include_missing: false))
        {
          sync_enabled: setting.sync_enabled,
          calendar_id: setting.calendar_id
        }
      end
    end
  end
end
