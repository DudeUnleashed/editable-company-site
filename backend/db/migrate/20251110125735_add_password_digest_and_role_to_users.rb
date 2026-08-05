class AddPasswordDigestAndRoleToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :password_digest, :string, null: false
    add_column :users, :role, :string, default: 'customer', null: false
    add_column :users, :is_admin, :boolean, default: false, null: false
    add_index :users, :role
  end
end
