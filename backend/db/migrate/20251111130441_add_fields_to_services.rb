class AddFieldsToServices < ActiveRecord::Migration[7.2]
  def change
    add_column :services, :active, :boolean, default: true, null: false
    add_column :services, :estimated_duration, :integer, comment: "Duration in minutes"
    add_column :services, :category, :string, default: "general"

    add_index :services, :active
    add_index :services, :category
  end
end
