require_relative "entities/user_entity"

class Users < Grape::API
  format :json

  resource :users do
    desc "List all admin users"
    get do
      admin_only!
      present User.all, with: UserEntity
    end

    desc "Get a specific user"
    params do
      requires :id, type: Integer, desc: "User ID"
    end
    get ":id" do
      admin_only!
      user = User.find(params[:id])
      present user, with: UserEntity
    end
  end
end
