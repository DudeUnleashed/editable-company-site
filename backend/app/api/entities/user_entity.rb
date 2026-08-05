class UserEntity < Grape::Entity
  expose :id
  expose :name
  expose :email
  expose :created_at
end