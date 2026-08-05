class AddCompletionEmailSentAtToServiceRequests < ActiveRecord::Migration[7.2]
  def change
    add_column :service_requests, :completion_email_sent_at, :datetime
  end
end
