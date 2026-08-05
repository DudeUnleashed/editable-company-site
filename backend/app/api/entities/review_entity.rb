class ReviewEntity < Grape::Entity
  expose :id
  expose :customer_name
  expose :content
  expose :rating
  expose :service_category
  expose :review_date
  expose :featured
  expose :active
  expose :position
  expose :created_at
end
