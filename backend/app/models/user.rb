class User < ApplicationRecord
  has_secure_password

  has_one :google_calendar_setting, dependent: :destroy
  has_many :refresh_tokens, dependent: :destroy

  before_validation :sanitize_inputs

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :phone, format: { with: /\A[0-9\s\-\+\(\)]*\z/, allow_blank: true }
  validates :password, length: { minimum: 6 }, if: -> { password.present? }

  def admin?
    true
  end

  def display_name
    name
  end

  private

  def sanitize_inputs
    self.name = InputSanitizer.sanitize_text(name) if name.present?
    self.phone = InputSanitizer.sanitize_text(phone) if phone.present?
  end
end
