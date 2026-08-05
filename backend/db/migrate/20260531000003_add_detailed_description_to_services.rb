class AddDetailedDescriptionToServices < ActiveRecord::Migration[7.2]
  def change
    add_column :services, :detailed_description, :text
  end
end
