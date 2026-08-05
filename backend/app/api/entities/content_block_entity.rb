class ContentBlockEntity < Grape::Entity
  expose :id
  expose :page
  expose :section
  expose :content_type
  expose :content
  expose :position
  expose :active
  expose :updated_at
end
