class CreateInitialTables < ActiveRecord::Migration[7.2]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false, index: { unique: true }
      t.string :phone
      t.timestamps
    end

    create_table :services do |t|
      t.string :name, null: false
      t.text :description
      t.decimal :base_price, precision: 10, scale: 2
      t.timestamps
    end

    create_table :service_requests do |t|
      t.references :user, null: false, foreign_key: true
      t.references :service, foreign_key: true, null: true # null for custom requests

      # Customer-provided information (quote request phase)
      t.string :car_type
      t.string :rego_or_vin
      t.date :last_serviced_on
      t.text :notes
      t.string :preferred_contact_method # "email", "phone", "either"
      t.boolean :returning_customer, default: false

      # Status tracking
      t.string :status, default: "pending" # pending, accepted, rejected, scheduled, in_progress, completed, cancelled

      # Job-specific fields (populated when converted to scheduled job)
      t.decimal :quoted_price, precision: 10, scale: 2      # Admin's actual quote amount
      t.datetime :scheduled_start                            # Job start date/time (appears on calendar)
      t.datetime :scheduled_end                              # Job end date/time (for calendar blocking)
      t.integer :estimated_duration_minutes                  # Expected job duration
      t.text :admin_notes                                    # Internal notes (not visible to customer)
      t.string :assigned_technician                          # Who's performing the work

      # Timestamp tracking
      t.datetime :accepted_at                                # When quote was accepted
      t.datetime :completed_at                               # When job was finished

      t.timestamps
    end

    # Index for calendar queries (fetch jobs by date range)
    add_index :service_requests, :scheduled_start
  end
end
