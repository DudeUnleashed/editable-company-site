class Review < ApplicationRecord
  before_validation :sanitize_inputs

  validates :customer_name, presence: true
  validates :content, presence: true
  validates :rating, presence: true, inclusion: { in: 1..5 }

  scope :active, -> { where(active: true) }
  scope :featured, -> { where(featured: true) }
  scope :ordered, -> { order(position: :asc, created_at: :desc) }

  private

  def sanitize_inputs
    self.customer_name = InputSanitizer.sanitize_text(customer_name) if customer_name.present?
    self.content = InputSanitizer.sanitize_text(content) if content.present?
    self.service_category = InputSanitizer.sanitize_text(service_category) if service_category.present?
  end
end
