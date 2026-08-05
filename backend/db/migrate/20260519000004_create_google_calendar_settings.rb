class CreateGoogleCalendarSettings < ActiveRecord::Migration[7.2]
  def change
    create_table :google_calendar_settings do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.text :access_token
      t.text :refresh_token
      t.datetime :expires_at
      t.string :calendar_id, default: "primary"
      t.boolean :sync_enabled, default: true, null: false
      t.datetime :last_synced_at

      t.timestamps
    end
  end
end
