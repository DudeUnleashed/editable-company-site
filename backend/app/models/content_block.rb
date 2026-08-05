class ContentBlock < ApplicationRecord
  has_one_attached :favicon_file
  has_one_attached :logo_file

  before_validation :sanitize_content

  validates :page, presence: true
  validates :section, presence: true, uniqueness: { scope: :page }
  validates :content_type, inclusion: { in: %w[text html json] }

  scope :for_page, ->(page) { where(page: page).order(:position) }
  scope :active, -> { where(active: true) }

  private

  def sanitize_content
    return if content.blank?

    case content_type
    when "html"
      self.content = InputSanitizer.sanitize_cms_html(content)
    when "text"
      self.content = InputSanitizer.sanitize_text(content)
    end
  end
end
