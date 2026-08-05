class AuditLog < ApplicationRecord
  belongs_to :user, optional: true

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_resource, ->(type, id) { where(resource_type: type, resource_id: id) }
  scope :by_action, ->(action) { where(action: action) }

  def self.log(action:, user: nil, resource: nil, details: {}, request: nil)
    create(
      user: user,
      action: action,
      resource_type: resource&.class&.name,
      resource_id: resource&.id,
      details: details,
      ip_address: request&.ip,
      user_agent: request&.user_agent&.truncate(500),
      created_at: Time.current
    )
  rescue => e
    Rails.logger.error("AuditLog.log failed: #{e.message}")
  end
end
