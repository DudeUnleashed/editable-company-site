class AddNotesAndSuggestedServicesToCustomers < ActiveRecord::Migration[7.2]
  def change
    add_column :customers, :notes, :text
    add_column :customers, :suggested_next_services, :text
  end
end
