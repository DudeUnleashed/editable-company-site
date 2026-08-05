class RefreshToken < ApplicationRecord
  belongs_to :user

  scope :active, -> { where(revoked_at: nil).where('expires_at > ?', Time.current) }

  def self.generate_for(user, request: nil)
    raw_token = SecureRandom.urlsafe_base64(64)
    digest = Digest::SHA256.hexdigest(raw_token)

    create!(
      user: user,
      token_digest: digest,
      expires_at: 7.days.from_now,
      ip_address: request&.ip,
      user_agent: request&.user_agent&.truncate(500)
    )

    raw_token
  end

  def self.find_by_raw_token(raw_token)
    return nil if raw_token.blank?
    digest = Digest::SHA256.hexdigest(raw_token)
    active.find_by(token_digest: digest)
  end

  def revoke!
    update!(revoked_at: Time.current)
  end

  def self.cleanup_expired
    where('expires_at < ?', Time.current)
      .or(where.not(revoked_at: nil).where('revoked_at < ?', 30.days.ago))
      .delete_all
  end
end
