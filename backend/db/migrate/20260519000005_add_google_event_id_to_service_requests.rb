class AddGoogleEventIdToServiceRequests < ActiveRecord::Migration[7.2]
  def change
    add_column :service_requests, :google_event_id, :string
    add_index :service_requests, :google_event_id
  end
end
