namespace :tokens do
  desc "Clean up expired and revoked refresh tokens"
  task cleanup: :environment do
    count = RefreshToken.cleanup_expired
    puts "Cleaned up #{count} expired/revoked refresh tokens"
  end
end
