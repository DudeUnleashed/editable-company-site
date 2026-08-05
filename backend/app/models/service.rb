class Service < ApplicationRecord
  has_many :service_requests
  has_one_attached :service_image

  # Validations
  validates :name, presence: true, uniqueness: true
  validates :base_price, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :estimated_duration, numericality: { greater_than: 0 }, allow_nil: true
  validates :category, inclusion: { in: %w[maintenance repair diagnostic inspection bodywork other general] }, allow_nil: true

  # Default scope - order by name alphabetically
  default_scope { order(name: :asc) }

  # Scopes for common queries
  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }
  scope :with_pricing, -> { where.not(base_price: nil) }
  scope :by_category, ->(category) { where(category: category) }
  scope :popular, -> { joins(:service_requests).group('services.id').order('COUNT(service_requests.id) DESC') }

  # Instance Methods

  # Returns formatted price string (e.g., "$120.00")
  def formatted_price
    base_price ? "$#{base_price.round(2)}" : "Quote Required"
  end

  # Returns true if this service has a set price
  def has_fixed_price?
    base_price.present?
  end

  # Returns count of service requests for this service
  def request_count
    service_requests.count
  end
end