class ServiceEntity < Grape::Entity
  expose :id
  expose :name
  expose :description
  expose :detailed_description
  expose :base_price
  expose :estimated_duration
  expose :category
  expose :active
  expose :created_at
  expose :updated_at

  expose :service_image_url do |service|
    if service.service_image.attached?
      host = ENV['BACKEND_HOST'] || 'http://localhost:3000'
      Rails.application.routes.url_helpers.rails_blob_url(service.service_image, host: host)
    end
  end
end