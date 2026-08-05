class EmailTemplateRenderer
  TEMPLATES = {
    quote_received: {
      section_subject: "quote_received_subject",
      section_body: "quote_received_body",
    },
    quote_received_company: {
      section_subject: "quote_received_company_subject",
      section_body: "quote_received_company_body",
    },
    job_completed: {
      section_subject: "job_completed_subject",
      section_body: "job_completed_body",
    },
  }.freeze

  def initialize(service_request)
    @sr = service_request
    @customer = service_request.customer
    @service = service_request.service
  end

  def render_subject(template_key)
    template = TEMPLATES[template_key]
    return default_subject(template_key) unless template

    block = ContentBlock.find_by(page: "emails", section: template[:section_subject])
    text = block&.content.presence || default_subject(template_key)
    substitute(text)
  end

  def render_body(template_key)
    template = TEMPLATES[template_key]
    return "" unless template

    block = ContentBlock.find_by(page: "emails", section: template[:section_body])
    text = block&.content.presence || ""
    substitute(text)
  end

  private

  def substitute(text)
    vars = {
      "customer_name" => @customer&.name || "",
      "customer_email" => @customer&.email || "",
      "customer_phone" => @customer&.phone || "",
      "request_id" => @sr.id.to_s,
      "service_name" => @service&.name || "Custom Service",
      "service_description" => @service&.description || "",
      "service_base_price" => @service&.base_price ? "$#{'%.2f' % @service.base_price}" : "N/A",
      "car_type" => @sr.car_type || "",
      "rego_or_vin" => @sr.rego_or_vin || "",
      "notes" => @sr.notes || "",
      "admin_notes" => @sr.admin_notes || "",
      "quoted_price" => @sr.quoted_price ? "$#{'%.2f' % @sr.quoted_price}" : "N/A",
      "scheduled_start" => @sr.scheduled_start&.strftime("%d/%m/%Y %I:%M %p") || "",
      "scheduled_end" => @sr.scheduled_end&.strftime("%d/%m/%Y %I:%M %p") || "",
      "assigned_technician" => @sr.assigned_technician || "",
      "completed_at" => @sr.completed_at&.strftime("%d/%m/%Y %I:%M %p") || "",
      "created_at" => @sr.created_at&.strftime("%d/%m/%Y %I:%M %p") || "",
      "company_name" => ENV["COMPANY_NAME"] || "Our Company",
      "company_email" => ENV["COMPANY_EMAIL"] || "",
    }

    # HTML-escape all variable values to prevent XSS in email content
    text.gsub(/\{\{(\w+)\}\}/) { |_| ERB::Util.html_escape(vars[$1] || "") }
  end

  def default_subject(key)
    case key
    when :quote_received
      "Service Request Received - #{@service&.name || 'Custom Service'}"
    when :quote_received_company
      "New Service Request ##{@sr.id} from #{@customer&.name}"
    when :job_completed
      "Your Service Has Been Completed"
    else
      "Service Update"
    end
  end
end
