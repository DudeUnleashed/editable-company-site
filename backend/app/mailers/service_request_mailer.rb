class ServiceRequestMailer < ApplicationMailer
  default from: "#{ENV['COMPANY_NAME']} <#{ENV['COMPANY_EMAIL']}>"

  def quote_received(service_request_id)
    @service_request = ServiceRequest.find(service_request_id)
    renderer = EmailTemplateRenderer.new(@service_request)

    @body_html = renderer.render_body(:quote_received)
    subject = renderer.render_subject(:quote_received)

    mail(to: @service_request.customer.email, subject: subject) do |format|
      format.html { render "template" }
    end
  end

  def quote_received_company(service_request_id)
    @service_request = ServiceRequest.find(service_request_id)
    renderer = EmailTemplateRenderer.new(@service_request)

    @body_html = renderer.render_body(:quote_received_company)
    subject = renderer.render_subject(:quote_received_company)

    mail(to: ENV['COMPANY_EMAIL'], subject: subject) do |format|
      format.html { render "template" }
    end
  end

  def job_completed(service_request_id)
    @service_request = ServiceRequest.find(service_request_id)
    renderer = EmailTemplateRenderer.new(@service_request)

    @body_html = renderer.render_body(:job_completed)
    subject = renderer.render_subject(:job_completed)

    mail(to: @service_request.customer.email, subject: subject) do |format|
      format.html { render "template" }
    end
  end
end
