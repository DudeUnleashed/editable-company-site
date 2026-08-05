class ApplicationMailer < ActionMailer::Base
  default from: "#{ENV['COMPANY_NAME']} <#{ENV['COMPANY_EMAIL']}>"
  layout "mailer"
end
