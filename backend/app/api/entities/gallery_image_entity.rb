class GalleryImageEntity < Grape::Entity
  expose :id
  expose :caption
  expose :alt_text
  expose :position
  expose :active
  expose :created_at

  expose :image_url do |image, options|
    if image.image.attached?
      host = ENV['BACKEND_HOST'] || 'http://localhost:3000'
      Rails.application.routes.url_helpers.rails_blob_url(image.image, host: host)
    end
  end

  expose :thumbnail_url do |image, options|
    if image.image.attached? && image.image.variable?
      host = ENV['BACKEND_HOST'] || 'http://localhost:3000'
      Rails.application.routes.url_helpers.rails_representation_url(
        image.image.variant(resize_to_limit: [400, 300]),
        host: host
      )
    end
  end
end
