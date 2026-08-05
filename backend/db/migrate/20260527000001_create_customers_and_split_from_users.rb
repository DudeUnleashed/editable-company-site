class CreateCustomersAndSplitFromUsers < ActiveRecord::Migration[7.2]
  def up
    # 1. Create customers table
    create_table :customers do |t|
      t.string :name, null: false
      t.string :email
      t.string :phone
      t.timestamps
    end
    add_index :customers, :email

    # 2. Copy customer users into customers table
    execute <<-SQL
      INSERT INTO customers (id, name, email, phone, created_at, updated_at)
      SELECT id, name, email, phone, created_at, updated_at
      FROM users
      WHERE role = 'customer'
    SQL

    # Reset the sequence so new customer IDs don't collide
    execute <<-SQL
      SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 0) + 1, false)
    SQL

    # 3. Add customer_id to service_requests
    add_column :service_requests, :customer_id, :bigint

    # 4. Populate customer_id from user_id (they share the same IDs from the copy)
    execute <<-SQL
      UPDATE service_requests
      SET customer_id = user_id
      WHERE user_id IN (SELECT id FROM customers)
    SQL

    # 5. Make customer_id not null and add FK
    change_column_null :service_requests, :customer_id, false
    add_foreign_key :service_requests, :customers
    add_index :service_requests, :customer_id

    # 6. Remove old user_id from service_requests
    remove_foreign_key :service_requests, :users
    remove_index :service_requests, :user_id
    remove_column :service_requests, :user_id

    # 7. Delete customer rows from users table
    execute "DELETE FROM users WHERE role = 'customer'"

    # 8. Clean up users table - remove customer-related columns
    remove_index :users, :role
    remove_column :users, :role
    remove_column :users, :is_admin
  end

  def down
    # Add back columns to users
    add_column :users, :role, :string, default: 'customer', null: false
    add_column :users, :is_admin, :boolean, default: false, null: false
    add_index :users, :role

    # Mark existing users as admin
    execute "UPDATE users SET role = 'admin', is_admin = true"

    # Copy customers back into users
    execute <<-SQL
      INSERT INTO users (id, name, email, phone, password_digest, role, is_admin, created_at, updated_at)
      SELECT id, name, COALESCE(email, ''), phone, '', 'customer', false, created_at, updated_at
      FROM customers
    SQL

    # Add user_id back to service_requests
    add_column :service_requests, :user_id, :bigint

    execute <<-SQL
      UPDATE service_requests SET user_id = customer_id
    SQL

    change_column_null :service_requests, :user_id, false
    add_index :service_requests, :user_id
    add_foreign_key :service_requests, :users

    # Remove customer_id
    remove_foreign_key :service_requests, :customers
    remove_index :service_requests, :customer_id
    remove_column :service_requests, :customer_id

    # Drop customers table
    drop_table :customers
  end
end
