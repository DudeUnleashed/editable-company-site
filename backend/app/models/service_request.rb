class ServiceRequest < ApplicationRecord
  # Associations
  belongs_to :customer
  belongs_to :service, optional: true

  # Sanitize user inputs before validation
  before_validation :sanitize_inputs

  # Timestamps
  before_save :set_status_timestamps, if: :status_changed?

  # Email notifications (only on creation — completion email is sent manually)
  after_create :send_quote_received_emails
  after_save :sync_to_google_calendar, if: :should_sync_to_google?

  # Status enum - tracks both quote phase and job phase
  enum status: {
    pending: "pending",           # Initial state - awaiting admin response (QUOTE)
    accepted: "accepted",          # Quote accepted by admin - ready to convert to job (QUOTE)
    rejected: "rejected",          # Quote rejected by admin (QUOTE - terminal state)
    scheduled: "scheduled",        # Converted to job with scheduled date (JOB)
    in_progress: "in_progress",    # Job currently being worked on (JOB)
    completed: "completed",        # Job finished (JOB - terminal state)
    cancelled: "cancelled"         # Job cancelled after scheduling (JOB - terminal state)
  }

  # Validations
  validates :preferred_contact_method, inclusion: { in: %w[email phone], allow_blank: true }
  validate :must_have_identification # Either car_type or rego_or_vin required

  # Job-specific validations (only when converted to job)
  validates :quoted_price, presence: true, numericality: { greater_than: 0 }, if: :is_job?
  validates :scheduled_start, presence: true, if: :is_job?
  validates :estimated_duration_minutes, numericality: { greater_than: 0 }, allow_nil: true
  validate :scheduled_end_after_start, if: -> { scheduled_start.present? && scheduled_end.present? }

  # Scopes for common queries
  scope :recent, -> { order(created_at: :desc) }
  scope :for_service, ->(service_id) { where(service_id: service_id) }
  scope :this_week, -> { where('created_at >= ?', 1.week.ago) }

  # Quote-specific scopes (requests that haven't been converted to jobs yet)
  scope :quotes_only, -> { where(status: %w[pending accepted rejected]) }
  scope :needing_response, -> { where(status: 'pending') }
  scope :accepted_quotes, -> { where(status: 'accepted') } # Ready to convert to jobs

  # Job-specific scopes (requests that have been converted to scheduled jobs)
  scope :jobs_only, -> { where(status: %w[scheduled in_progress completed cancelled]).where.not(scheduled_start: nil) }
  scope :scheduled_jobs, -> { where(status: 'scheduled') }
  scope :active_jobs, -> { where(status: %w[scheduled in_progress]) }
  scope :completed_jobs, -> { where(status: 'completed') }

  # Calendar-specific scopes
  scope :calendar_events, -> { jobs_only.where.not(scheduled_start: nil).order(:scheduled_start) }
  scope :in_date_range, ->(start_date, end_date) {
    where('scheduled_start >= ? AND scheduled_start <= ?', start_date, end_date)
  }

  # Instance Methods

  # Returns true if this is still a quote (not yet converted to job)
  def is_quote?
    %w[pending accepted rejected].include?(status) && scheduled_start.nil?
  end

  # Returns true if this has been converted to a scheduled job
  def is_job?
    %w[scheduled in_progress completed cancelled].include?(status) || scheduled_start.present?
  end

  # Returns true if quote is still pending admin decision
  def pending_review?
    pending?
  end

  # Returns true if job is currently active (scheduled or in progress)
  def active?
    scheduled? || in_progress?
  end

  # Returns true if request is finalized (completed, rejected, or cancelled)
  def finalized?
    completed? || rejected? || cancelled?
  end

  # Returns customer's preferred contact (email or phone)
  def contact_info
    preferred_contact_method == 'email' ? customer.email : customer.phone
  end

  # Returns a human-readable summary of the request
  def summary
    service_name = service&.name || "Custom Service"
    "#{service_name} for #{customer.name} (#{car_type || rego_or_vin})"
  end

  # Returns formatted price string
  def formatted_quoted_price
    quoted_price ? "$#{quoted_price.round(2)}" : "Not quoted"
  end

  # Returns formatted duration string
  def formatted_duration
    return "Not set" unless estimated_duration_minutes
    hours = estimated_duration_minutes / 60
    minutes = estimated_duration_minutes % 60
    hours > 0 ? "#{hours}h #{minutes}m" : "#{minutes}m"
  end

  # Converts a quote (pending/accepted) into a scheduled job
  # Params: { quoted_price:, scheduled_start:, scheduled_end:, estimated_duration_minutes:, admin_notes:, assigned_technician: }
  def convert_to_job!(params)
    raise "Can only convert pending or accepted quotes to jobs" unless pending? || accepted?

    self.quoted_price = params[:quoted_price]
    self.scheduled_start = params[:scheduled_start]
    self.scheduled_end = params[:scheduled_end]
    self.estimated_duration_minutes = params[:estimated_duration_minutes]
    self.admin_notes = params[:admin_notes]
    self.assigned_technician = params[:assigned_technician] || "Main Technician"
    self.accepted_at = Time.current if accepted_at.nil?
    self.status = "scheduled"

    # Calculate end time if duration provided but no end time
    if scheduled_end.nil? && estimated_duration_minutes.present?
      self.scheduled_end = scheduled_start + estimated_duration_minutes.minutes
    end

    save!
  end

  # Updates job schedule (for drag-and-drop rescheduling)
  def reschedule!(new_start, new_end = nil)
    raise "Can only reschedule jobs, not quotes" unless is_job?

    self.scheduled_start = new_start
    self.scheduled_end = new_end if new_end.present?

    # Recalculate end time based on duration if no end provided
    if scheduled_end.nil? && estimated_duration_minutes.present?
      self.scheduled_end = scheduled_start + estimated_duration_minutes.minutes
    end

    save!
  end

  private

  def set_status_timestamps
    self.accepted_at = Time.current if status == 'accepted' && accepted_at.nil?
    self.completed_at = Time.current if status == 'completed' && completed_at.nil?
  end

  # Custom validation: require either car_type or rego_or_vin
  def must_have_identification
    if car_type.blank? && rego_or_vin.blank?
      errors.add(:base, "Must provide either car type or registration/VIN")
    end
  end

  # Custom validation: scheduled_end must be after scheduled_start
  def scheduled_end_after_start
    if scheduled_end <= scheduled_start
      errors.add(:scheduled_end, "must be after scheduled start time")
    end
  end

  # Sanitize text inputs to prevent XSS attacks
  def sanitize_inputs
    self.car_type = InputSanitizer.sanitize_text(car_type) if car_type.present?
    self.rego_or_vin = InputSanitizer.sanitize_text(rego_or_vin) if rego_or_vin.present?
    self.notes = InputSanitizer.sanitize_text(notes) if notes.present?
    self.admin_notes = InputSanitizer.sanitize_text(admin_notes) if admin_notes.present?
    self.assigned_technician = InputSanitizer.sanitize_text(assigned_technician) if assigned_technician.present?
  end

  # Send emails when a new quote request is created
  def send_quote_received_emails
    # Send confirmation to customer
    ServiceRequestMailer.quote_received(id).deliver_later

    # Notify company about new request
    ServiceRequestMailer.quote_received_company(id).deliver_later
  end

  # Manually send completion email (called from API, not automatic)
  def send_completion_email!
    raise "Job must be completed first" unless completed?
    raise "Customer has no email address" if customer.email.blank?

    ServiceRequestMailer.job_completed(id).deliver_later
    update_column(:completion_email_sent_at, Time.current)
  end

  def should_sync_to_google?
    settings = GoogleCalendarSetting.current
    return false unless settings&.sync_enabled

    (saved_change_to_status? || saved_change_to_scheduled_start? || saved_change_to_scheduled_end?) && is_job?
  end

  def sync_to_google_calendar
    settings = GoogleCalendarSetting.current
    return unless settings

    service = GoogleCalendarService.new(settings)

    if google_event_id.present?
      if cancelled?
        service.delete_event(self)
      else
        service.update_event(self)
      end
    elsif scheduled_start.present?
      service.create_event(self)
    end
  rescue => e
    Rails.logger.error("Google Calendar sync failed for request #{id}: #{e.message}")
  end
end