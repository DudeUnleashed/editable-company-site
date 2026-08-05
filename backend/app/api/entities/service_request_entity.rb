require_relative "service_entity"
require_relative "customer_entity"

class ServiceRequestEntity < Grape::Entity
  expose :id
  expose :status                          # Current state: pending, accepted, in_progress, completed, cancelled
  expose :created_at                      # When the request was submitted
  expose :updated_at                      # Last modification timestamp

  expose :car_type                        # Make/model (e.g., "2019 Toyota Camry")
  expose :rego_or_vin                     # Registration number or VIN for identification
  expose :last_serviced_on                # Date of last service (helps assess urgency)

  expose :notes                           # Customer's description of issue/requirements
  expose :preferred_contact_method        # 'email' or 'phone'
  expose :returning_customer              # Boolean indicating if customer has prior history

  # These fields are only populated when request is converted to a scheduled job
  expose :quoted_price                    # Admin's quoted price (null for quotes)
  expose :scheduled_start                 # Job start date/time (null for quotes)
  expose :scheduled_end                   # Job end date/time (null if not set)
  expose :estimated_duration_minutes      # Expected job duration in minutes
  expose :admin_notes                     # Internal notes (visible to admin only)
  expose :assigned_technician             # Who's performing the work

  expose :accepted_at                     # When quote was accepted
  expose :completed_at                    # When job was finished
  expose :completion_email_sent_at        # When completion email was manually sent

  expose :customer, using: CustomerEntity  # Customer who submitted the request
  expose :service, using: ServiceEntity   # Service template (null for custom requests)
end