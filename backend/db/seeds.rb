puts "👤 Creating admin user..."

admin = User.find_or_create_by!(email: ENV['DEFAULT_ADMIN_EMAIL'] || 'admin@example.com') do |u|
  u.name = "Admin User"
  u.phone = "0400000000"
  u.password = ENV['DEFAULT_ADMIN_PASSWORD'] || 'Admin123!'
  u.password_confirmation = ENV['DEFAULT_ADMIN_PASSWORD'] || 'Admin123!'
end

puts "✅ Admin user ready (email: #{admin.email})"

puts "🔧 Creating services..."

[
  { name: "Oil Change", description: "Replace engine oil and filter with premium synthetic oil. Includes fluid level check and tire pressure adjustment.", base_price: 120.00 },
  { name: "Brake Pad Replacement", description: "Replace front or rear brake pads with quality aftermarket parts. Includes brake fluid inspection and rotor assessment.", base_price: 250.00 },
  { name: "Logbook Service", description: "Full manufacturer logbook scheduled service maintaining your warranty. Includes all required inspections and fluid replacements per manufacturer specifications.", base_price: 350.00 },
  { name: "Wheel Alignment", description: "Four-wheel computerized alignment to manufacturer specifications. Helps prevent uneven tire wear and improves handling.", base_price: 150.00 },
  { name: "Air Conditioning Service", description: "Complete AC system service including refrigerant recharge, leak detection, and performance testing.", base_price: 180.00 },
  { name: "Pre-Purchase Inspection", description: "Comprehensive 120-point inspection for used vehicle buyers. Includes detailed written report with photos of any issues found.", base_price: 200.00 },
  { name: "Diagnostic Scan", description: "Professional diagnostic scan to identify check engine lights and fault codes. Includes detailed explanation of findings.", base_price: 90.00 },
  { name: "Custom Work", description: "Custom automotive work quoted on a case-by-case basis. Contact us with your requirements for a detailed quote.", base_price: nil },
].each do |attrs|
  Service.find_or_create_by!(name: attrs[:name]) do |s|
    s.description = attrs[:description]
    s.base_price = attrs[:base_price]
  end
end

puts "✅ #{Service.count} services ready"

puts "📝 Creating content blocks..."

# --- HOME PAGE ---
home_blocks = [
  { page: "home", section: "hero_title", content_type: "text", content: "Welcome to MyCompany", position: 0 },
  { page: "home", section: "hero_subtitle", content_type: "text", content: "Quality Automotive Care You Can Trust", position: 1 },
  { page: "home", section: "stats_heading", content_type: "text", content: "Serving Our Community Since 2008", position: 2 },
  { page: "home", section: "stats_items", content_type: "json", position: 3, content: [
    { value: "15+", label: "Years Experience" },
    { value: "1000+", label: "Happy Customers" },
    { value: "100%", label: "Satisfaction Guaranteed" }
  ].to_json },
  { page: "home", section: "services_heading", content_type: "text", content: "Our Services", position: 4 },
  { page: "home", section: "services_cards", content_type: "json", position: 5, content: [
    { icon: "🔧", title: "Repairs & Diagnostics", description: "From engine repairs to brake replacements, our certified mechanics diagnose and fix issues quickly and reliably." },
    { icon: "🛠️", title: "Preventive Maintenance", description: "Regular oil changes, tire rotations, and inspections to keep your vehicle running smoothly and prevent costly repairs." },
    { icon: "⚡", title: "Emergency Services", description: "Need urgent repairs? We offer priority scheduling for breakdowns and critical automotive issues." }
  ].to_json },
  { page: "home", section: "why_choose_heading", content_type: "text", content: "Why Choose MyCompany?", position: 6 },
  { page: "home", section: "why_choose_items", content_type: "json", position: 7, content: [
    { title: "Certified Mechanics", description: "ASE-certified professionals with years of experience" },
    { title: "Transparent Pricing", description: "No hidden fees, upfront quotes for all services" },
    { title: "Quality Parts", description: "We use OEM and high-quality aftermarket parts" },
    { title: "Warranty Backed", description: "All repairs come with our satisfaction guarantee" },
    { title: "Fast Turnaround", description: "Same-day service available for most repairs" },
    { title: "Customer First", description: "Dedicated to providing honest, reliable service" }
  ].to_json },
  { page: "home", section: "cta_heading", content_type: "text", content: "Ready to Get Started?", position: 8 },
  { page: "home", section: "cta_text", content_type: "text", content: "Request a service quote today and experience the difference quality automotive care makes.", position: 9 },
  { page: "home", section: "cta_button_text", content_type: "text", content: "Request Service Now", position: 10 },
  { page: "home", section: "contact_heading", content_type: "text", content: "Contact Us", position: 11 },
  { page: "home", section: "contact_subtext", content_type: "text", content: "Have questions? We're here to help!", position: 12 },
]

# --- ABOUT PAGE ---
about_blocks = [
  { page: "about", section: "hero_title", content_type: "text", content: "About Our Company", position: 0 },
  { page: "about", section: "hero_subtitle", content_type: "text", content: "Over 15 Years of Quality Automotive Care", position: 1 },
  { page: "about", section: "who_we_are_heading", content_type: "text", content: "Who We Are", position: 2 },
  { page: "about", section: "who_we_are_content", content_type: "html", position: 3, content: "<p>MyCompany has been proudly serving the community for over 15 years. What started as a small family-owned garage has grown into a trusted automotive service center, known for quality work and honest service.</p><p>Our team of ASE-certified mechanics brings decades of combined experience, staying up-to-date with the latest automotive technology and repair techniques. We treat every vehicle as if it were our own, ensuring every job is done right the first time.</p>" },
  { page: "about", section: "mission_heading", content_type: "text", content: "Our Mission", position: 4 },
  { page: "about", section: "mission_content", content_type: "html", position: 5, content: "<p>We believe in delivering excellent automotive care at fair prices. Our goal is to keep your car safe and reliable while making sure you feel confident every time you visit us.</p><p><strong>We're committed to:</strong></p><ul><li>Providing honest, transparent service recommendations</li><li>Using quality parts and proven repair methods</li><li>Respecting your time and budget</li><li>Building long-term relationships with our customers</li><li>Continuous training and improvement</li></ul>" },
  { page: "about", section: "values_heading", content_type: "text", content: "What Sets Us Apart", position: 6 },
  { page: "about", section: "values_cards", content_type: "json", position: 7, content: [
    { icon: "🏆", title: "Excellence", description: "We hold ourselves to the highest standards of workmanship and customer service. Every repair is performed with precision and care." },
    { icon: "💡", title: "Integrity", description: "Honesty is our foundation. We'll never recommend unnecessary services and always explain our recommendations clearly." },
    { icon: "🤝", title: "Trust", description: "We've built our reputation on reliability and transparency. Our customers return because they know they can count on us." }
  ].to_json },
  { page: "about", section: "team_heading", content_type: "text", content: "Meet Our Team", position: 8 },
  { page: "about", section: "team_intro", content_type: "text", content: "Our skilled technicians are the heart of our business. Each member brings specialized expertise and a passion for automotive excellence:", position: 9 },
  { page: "about", section: "team_cards", content_type: "json", position: 10, content: [
    { icon: "👨‍🔧", title: "Lead Technicians", description: "ASE Master Certified with 20+ years combined experience in diagnostics, engine repair, and transmission service." },
    { icon: "🔍", title: "Diagnostic Specialists", description: "Expert troubleshooters who can identify and resolve even the most complex automotive issues quickly and efficiently." },
    { icon: "📋", title: "Service Advisors", description: "Friendly, knowledgeable staff who explain everything clearly and help you make informed decisions about your vehicle." }
  ].to_json },
  { page: "about", section: "certifications_heading", content_type: "text", content: "Certifications & Recognition", position: 11 },
  { page: "about", section: "certifications_intro", content_type: "text", content: "We're proud to maintain industry-leading certifications and training:", position: 12 },
  { page: "about", section: "certifications_items", content_type: "json", position: 13, content: [
    "ASE (Automotive Service Excellence) Certified Technicians",
    "EPA Section 609 Certified for A/C Service",
    "Factory-Trained on Major Automotive Brands",
    "Member of Better Business Bureau (A+ Rating)",
    "Recipient of Local Business Award (2022, 2023)"
  ].to_json },
  { page: "about", section: "timeline_heading", content_type: "text", content: "Our Journey", position: 14 },
  { page: "about", section: "timeline_items", content_type: "json", position: 15, content: [
    { year: "2008", title: "The Beginning", description: "MyCompany opened its doors with a simple mission: provide honest, quality automotive service." },
    { year: "2012", title: "Expansion", description: "Added 3 more service bays and expanded our team to meet growing customer demand." },
    { year: "2018", title: "Modernization", description: "Invested in state-of-the-art diagnostic equipment and training for electric vehicle service." },
    { year: "2023", title: "Today", description: "Serving 1000+ satisfied customers annually with comprehensive automotive care services." }
  ].to_json },
  { page: "about", section: "cta_heading", content_type: "text", content: "Experience the Difference", position: 16 },
  { page: "about", section: "cta_text", content_type: "text", content: "Join our family of satisfied customers and discover why we're the trusted choice for automotive care.", position: 17 },
  { page: "about", section: "cta_button_text", content_type: "text", content: "Schedule Your Service", position: 18 },
]

# --- SERVICES PAGE ---
services_page_blocks = [
  { page: "services_page", section: "hero_title", content_type: "text", content: "Our Services", position: 0 },
  { page: "services_page", section: "hero_subtitle", content_type: "text", content: "Professional Automotive Care for Every Need", position: 1 },
  { page: "services_page", section: "page_intro", content_type: "text", content: "From routine maintenance to complex repairs, our certified mechanics deliver quality workmanship on every job. Browse our services below and request a quote today.", position: 2 },
]

# Settings / Business Info content blocks
settings_blocks = [
  { page: "settings", section: "tab_title", content_type: "text", content: "MyCompany Auto Service", position: 0 },
  { page: "settings", section: "tab_description", content_type: "text", content: "Professional automotive repair and maintenance services. Request a quote online today.", position: 1 },
  { page: "settings", section: "color_accent", content_type: "text", content: "#2563eb", position: 2 },
  { page: "settings", section: "color_hero", content_type: "text", content: "#2b6cb0", position: 3 },
  { page: "settings", section: "color_footer", content_type: "text", content: "#1e293b", position: 4 },
  { page: "settings", section: "business_name", content_type: "text", content: "MyCompany", position: 5 },
  { page: "settings", section: "business_description", content_type: "text", content: "Quality automotive care you can trust", position: 6 },
  { page: "settings", section: "business_hours", content_type: "text", content: "Mon-Fri 7:30am-5:30pm, Sat 8am-1pm", position: 7 },
  { page: "settings", section: "google_reviews_url", content_type: "text", content: "https://g.page/your-business/review", position: 8 },
  { page: "settings", section: "contact_phone", content_type: "text", content: "(555) 123-4567", position: 9 },
  { page: "settings", section: "contact_email", content_type: "text", content: "info@mycompany.com", position: 10 },
  { page: "settings", section: "contact_address", content_type: "text", content: "123 Main Street, Your City, ST 12345", position: 11 },
]

# Email template content blocks
quote_received_body = <<~'HTML'
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
  <div style="background-color:#2563eb;color:white;padding:20px;text-align:center;">
    <h1>{{company_name}}</h1>
  </div>
  <div style="background-color:#f9fafb;padding:30px;">
    <h2>Service Request Received</h2>
    <p>Hi {{customer_name}},</p>
    <p>Thank you for submitting a service request with us! We've received your request and will review it shortly.</p>
    <div style="background:white;padding:20px;margin:20px 0;border-radius:8px;">
      <h3>Request Details</h3>
      <p><strong>Request ID:</strong> #{{request_id}}</p>
      <p><strong>Service:</strong> {{service_name}}</p>
      <p><strong>Vehicle:</strong> {{car_type}}</p>
      <p><strong>Rego/VIN:</strong> {{rego_or_vin}}</p>
      <p><strong>Submitted:</strong> {{created_at}}</p>
    </div>
    <p>We'll send you a quote within 24-48 hours. If you have any questions in the meantime, feel free to reply to this email.</p>
    <p>Best regards,<br/>The {{company_name}} Team</p>
  </div>
  <div style="text-align:center;padding:20px;color:#6b7280;font-size:14px;">
    <p>This is an automated email from {{company_name}}.<br/>{{company_email}}</p>
  </div>
</div>
HTML

quote_received_company_body = <<~'HTML'
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
  <div style="background-color:#10b981;color:white;padding:20px;text-align:center;">
    <h1>New Service Request</h1>
  </div>
  <div style="background-color:#f9fafb;padding:30px;">
    <div style="background-color:#fef3c7;padding:15px;border-left:4px solid #f59e0b;margin:0 0 20px;">
      <strong>Action Required:</strong> Review and respond to this service request.
    </div>
    <h2>Customer Information</h2>
    <div style="background:white;padding:20px;margin:20px 0;border-radius:8px;">
      <p><strong>Name:</strong> {{customer_name}}</p>
      <p><strong>Email:</strong> {{customer_email}}</p>
      <p><strong>Phone:</strong> {{customer_phone}}</p>
    </div>
    <h2>Service Request Details</h2>
    <div style="background:white;padding:20px;margin:20px 0;border-radius:8px;">
      <p><strong>Request ID:</strong> #{{request_id}}</p>
      <p><strong>Service:</strong> {{service_name}}</p>
      <p><strong>Base Price:</strong> {{service_base_price}}</p>
      <p><strong>Vehicle:</strong> {{car_type}}</p>
      <p><strong>Rego/VIN:</strong> {{rego_or_vin}}</p>
      <p><strong>Customer Notes:</strong> {{notes}}</p>
      <p><strong>Submitted:</strong> {{created_at}}</p>
    </div>
  </div>
</div>
HTML

job_completed_body = <<~'HTML'
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;">
  <div style="background-color:#10b981;color:white;padding:20px;text-align:center;">
    <h1>Service Completed!</h1>
  </div>
  <div style="background-color:#f9fafb;padding:30px;">
    <div style="background-color:#d1fae5;padding:15px;border-left:4px solid #10b981;margin:0 0 20px;">
      <strong>Thank you for choosing {{company_name}}!</strong>
    </div>
    <p>Hi {{customer_name}},</p>
    <p>We're pleased to inform you that your service has been completed successfully.</p>
    <div style="background:white;padding:20px;margin:20px 0;border-radius:8px;">
      <h3>Service Summary</h3>
      <p><strong>Job ID:</strong> #{{request_id}}</p>
      <p><strong>Service:</strong> {{service_name}}</p>
      <p><strong>Vehicle:</strong> {{car_type}}</p>
      <p><strong>Completed:</strong> {{completed_at}}</p>
      <p><strong>Technician:</strong> {{assigned_technician}}</p>
    </div>
    <p><strong>What's Next:</strong></p>
    <ul>
      <li>Keep this email for your records</li>
      <li>Schedule your next service appointment when due</li>
      <li>Contact us if you have any questions or concerns</li>
    </ul>
    <p>We appreciate your business and look forward to serving you again!</p>
    <p>Best regards,<br/>The {{company_name}} Team</p>
  </div>
  <div style="text-align:center;padding:20px;color:#6b7280;font-size:14px;">
    <p>This is an automated email from {{company_name}}.<br/>{{company_email}}</p>
  </div>
</div>
HTML

email_blocks = [
  { page: "emails", section: "quote_received_subject", content_type: "text",
    content: "Service Request Received - {{service_name}}", position: 0 },
  { page: "emails", section: "quote_received_body", content_type: "html",
    content: quote_received_body.strip, position: 1 },
  { page: "emails", section: "quote_received_company_subject", content_type: "text",
    content: 'New Service Request #{{request_id}} from {{customer_name}}', position: 2 },
  { page: "emails", section: "quote_received_company_body", content_type: "html",
    content: quote_received_company_body.strip, position: 3 },
  { page: "emails", section: "job_completed_subject", content_type: "text",
    content: "Your Service Has Been Completed", position: 4 },
  { page: "emails", section: "job_completed_body", content_type: "html",
    content: job_completed_body.strip, position: 5 },
]

all_blocks = home_blocks + about_blocks + services_page_blocks + settings_blocks + email_blocks
all_blocks.each do |attrs|
  ContentBlock.find_or_create_by!(page: attrs[:page], section: attrs[:section]) do |b|
    b.content_type = attrs[:content_type]
    b.content = attrs[:content]
    b.position = attrs[:position]
  end
end

puts "✅ #{ContentBlock.count} content blocks ready"

# --- DEMO DATA (development only) ---
unless Rails.env.production?
  puts "\n📦 Loading development demo data..."

  customers = Customer.create!([
    { name: "Alice Johnson", email: "alice.johnson@example.com", phone: "0412345678" },
    { name: "Bob Smith", email: "bob.smith@example.com", phone: "0498765432" },
    { name: "Charlie Chen", email: "charlie.chen@example.com", phone: "0423456789" },
    { name: "Diana Martinez", email: "diana.martinez@example.com", phone: "0487654321" },
    { name: "Ethan Wilson", email: "ethan.wilson@example.com" }
  ])

  puts "✅ Created #{customers.count} demo customers"

  services = Service.all.order(:id).to_a

  ServiceRequest.create!([
    {
      customer: customers[0], service: services[0],
      car_type: "2019 Toyota Corolla", rego_or_vin: "ABC123",
      last_serviced_on: Date.today - 180.days,
      notes: "Customer requested synthetic oil. Car has 60,000km on odometer.",
      preferred_contact_method: "email", returning_customer: true, status: "pending"
    },
    {
      customer: customers[2], service: services[6],
      car_type: "2015 Mazda CX-5", rego_or_vin: "DEF456",
      last_serviced_on: Date.today - 90.days,
      notes: "Check engine light came on yesterday. No unusual noises or performance issues.",
      preferred_contact_method: "phone", returning_customer: false, status: "pending"
    },
    {
      customer: customers[4], service: services[5],
      car_type: "", rego_or_vin: "JKL012",
      notes: "Looking to buy this car from private seller. Need inspection ASAP before committing.",
      preferred_contact_method: "email", returning_customer: false, status: "pending"
    },
    {
      customer: customers[3], service: services[4],
      car_type: "2020 Honda Civic", rego_or_vin: "GHI789",
      last_serviced_on: Date.today - 200.days,
      notes: "AC not blowing cold air. System was working fine last month.",
      preferred_contact_method: "email", returning_customer: true,
      status: "accepted", accepted_at: 2.days.ago
    },
    {
      customer: customers[1], service: services[1],
      car_type: "2018 Mazda 3", rego_or_vin: "XYZ789",
      last_serviced_on: Date.today - 365.days,
      notes: "Brake pads squeaking when stopping. Mostly occurs in the morning.",
      preferred_contact_method: "phone", returning_customer: false,
      status: "scheduled", quoted_price: 280.00,
      scheduled_start: Date.tomorrow + 9.hours, scheduled_end: Date.tomorrow + 11.hours,
      estimated_duration_minutes: 120, assigned_technician: "Main Technician",
      admin_notes: "Customer mentioned slight vibration when braking. Check rotors for warping.",
      accepted_at: 3.days.ago
    },
    {
      customer: customers[0], service: services[0],
      car_type: "2016 Honda Accord", rego_or_vin: "RST123",
      last_serviced_on: Date.today - 200.days,
      notes: "Regular service needed.",
      preferred_contact_method: "email", returning_customer: true,
      status: "scheduled", quoted_price: 130.00,
      scheduled_start: Date.today + 2.days + 10.hours, scheduled_end: Date.today + 2.days + 11.hours,
      estimated_duration_minutes: 60, assigned_technician: "Main Technician",
      admin_notes: "Synthetic oil as requested. Check air filter condition.",
      accepted_at: 4.days.ago
    },
    {
      customer: customers[0], service: services[2],
      car_type: "2021 Toyota Camry", rego_or_vin: "MNO345",
      last_serviced_on: Date.today - 180.days,
      notes: "40,000km service due. Car is still under warranty.",
      preferred_contact_method: "email", returning_customer: true,
      status: "in_progress", quoted_price: 360.00,
      scheduled_start: Date.today + 8.hours, scheduled_end: Date.today + 12.hours,
      estimated_duration_minutes: 240, assigned_technician: "Main Technician",
      admin_notes: "Follow manufacturer logbook. Check all fluid levels and filters.",
      accepted_at: 7.days.ago
    },
    {
      customer: customers[1], service: services[0],
      car_type: "2016 Ford Ranger", rego_or_vin: "STU901",
      last_serviced_on: Date.today - 210.days,
      notes: "Regular service. No issues.",
      preferred_contact_method: "email", returning_customer: true,
      status: "completed", quoted_price: 125.00,
      scheduled_start: 2.days.ago + 9.hours, scheduled_end: 2.days.ago + 10.hours,
      estimated_duration_minutes: 60, assigned_technician: "Main Technician",
      admin_notes: "Routine service completed. No issues found.",
      accepted_at: 5.days.ago, completed_at: 2.days.ago + 9.5.hours
    },
    {
      customer: customers[3], service: services[7],
      car_type: "2010 BMW 3 Series", rego_or_vin: "VWX234",
      last_serviced_on: Date.today - 400.days,
      notes: "Need full engine rebuild. Car has done 250,000km.",
      preferred_contact_method: "phone", returning_customer: false, status: "rejected"
    },
  ])

  puts "✅ Created #{ServiceRequest.count} demo service requests"

  Review.create!([
    { customer_name: "Sarah Mitchell", content: "Absolutely fantastic service! They fixed my brakes quickly and the price was very fair. I've been coming here for 3 years now and they never disappoint.", rating: 5, service_category: "repair", review_date: Date.today - 30.days, featured: true, position: 0 },
    { customer_name: "James Turner", content: "Had my logbook service done here and they were thorough and professional. They even spotted a small issue that could have become a big problem. Highly recommend!", rating: 5, service_category: "maintenance", review_date: Date.today - 60.days, featured: true, position: 1 },
    { customer_name: "Lisa Chen", content: "Great diagnostic work. My car had an intermittent issue that two other shops couldn't figure out. These guys found it on the first visit. Very knowledgeable team.", rating: 5, service_category: "diagnostic", review_date: Date.today - 45.days, featured: false, position: 2 },
    { customer_name: "Mark Davidson", content: "Honest and reliable. They told me what I actually needed rather than trying to upsell. Fair pricing and quality work. Will definitely be back.", rating: 4, service_category: "repair", review_date: Date.today - 90.days, featured: false, position: 3 },
    { customer_name: "Amanda Brooks", content: "Got a pre-purchase inspection done before buying a used car. The report was incredibly detailed and saved me from a bad purchase. Worth every cent!", rating: 5, service_category: "inspection", review_date: Date.today - 15.days, featured: true, position: 4 },
  ])

  puts "✅ Created #{Review.count} demo reviews"
end

puts "\n" + "="*50
puts "🎉 Database seeding completed!"
puts "="*50
puts "Admin: #{admin.email}"
puts "Services: #{Service.count}"
puts "Content blocks: #{ContentBlock.count}"
unless Rails.env.production?
  puts "Customers: #{Customer.count}"
  puts "Service requests: #{ServiceRequest.count}"
  puts "Reviews: #{Review.count}"
end
puts "="*50
