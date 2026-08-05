class Customer < ApplicationRecord
  has_many :service_requests, dependent: :destroy

  before_validation :sanitize_inputs

  validates :name, presence: true, format: { without: /[\r\n]/, message: "cannot contain line breaks" }
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validate :email_has_no_newlines
  validates :phone, format: { with: /\A[0-9\s\-\+\(\)]*\z/ }, allow_blank: true

  scope :recently_created, -> { order(created_at: :desc) }
  scope :returning_customers, -> { joins(:service_requests).group('customers.id').having('COUNT(service_requests.id) > 1') }

  def returning_customer?
    service_requests.count > 1
  end

  def latest_request
    service_requests.order(created_at: :desc).first
  end

  def display_name
    name
  end

  private

  def email_has_no_newlines
    errors.add(:email, "cannot contain line breaks") if email.present? && email.match?(/[\r\n]/)
  end

  def sanitize_inputs
    self.name = InputSanitizer.sanitize_text(name) if name.present?
    self.phone = InputSanitizer.sanitize_text(phone) if phone.present?
    self.notes = InputSanitizer.sanitize_text(notes) if notes.present?
    self.suggested_next_services = InputSanitizer.sanitize_text(suggested_next_services) if suggested_next_services.present?
  end
end
