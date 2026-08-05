class GoogleCalendarSetting < ApplicationRecord
  belongs_to :user

  encrypts :access_token
  encrypts :refresh_token

  validates :user_id, uniqueness: true

  def token_expired?
    expires_at.present? && expires_at < Time.current
  end

  def self.current
    first
  end
end
