class CustomerEntity < Grape::Entity
  expose :id
  expose :name
  expose :email
  expose :phone
  expose :notes
  expose :suggested_next_services
  expose :created_at
end
