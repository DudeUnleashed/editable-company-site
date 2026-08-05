Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Read allowed origins from environment variable
    # Set ALLOWED_ORIGINS in .env file (comma-separated)
    # Example: ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
    allowed_origins = if Rails.env.production?
      ENV.fetch('ALLOWED_ORIGINS').split(',')
    else
      ENV['ALLOWED_ORIGINS']&.split(',') || ['http://localhost:5173']
    end

    origins allowed_origins

    resource '/api/*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true, # Required for Authorization headers
      expose: ['Authorization'], # Allow client to read Authorization header
      max_age: 600 # Cache preflight requests for 10 minutes

    resource '/rails/active_storage/*',
      headers: :any,
      methods: [:get],
      max_age: 600
  end
end