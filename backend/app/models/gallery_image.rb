class GalleryImage < ApplicationRecord
  has_one_attached :image

  validates :image, presence: true
  validate :acceptable_image

  before_validation :sanitize_inputs

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(position: :asc, created_at: :desc) }

  private

  def acceptable_image
    return unless image.attached?

    unless image.blob.byte_size <= 10.megabytes
      errors.add(:image, "is too large (maximum 10MB)")
    end

    acceptable_types = ["image/jpeg", "image/png", "image/webp"]
    unless acceptable_types.include?(image.blob.content_type)
      errors.add(:image, "must be JPEG, PNG, or WebP")
    end
  end

  def sanitize_inputs
    self.caption = InputSanitizer.sanitize_text(caption) if caption.present?
    self.alt_text = InputSanitizer.sanitize_text(alt_text) if alt_text.present?
  end
end
