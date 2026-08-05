class Rack::Attack
  # Throttle login attempts — 5 per IP per 15 minutes
  throttle("login/ip", limit: 5, period: 15.minutes) do |req|
    req.ip if req.path == "/api/auth/login" && req.post?
  end

  # Throttle public quote submissions — 5 per IP per hour
  throttle("requests/ip", limit: 5, period: 1.hour) do |req|
    req.ip if req.path == "/api/requests" && req.post?
  end

  # Throttle admin API — 100 per IP per minute
  throttle("admin/ip", limit: 100, period: 1.minute) do |req|
    req.ip if req.path.start_with?("/api/admin")
  end

  # Throttle token refresh — 10 per IP per 15 minutes
  throttle("refresh/ip", limit: 10, period: 15.minutes) do |req|
    req.ip if req.path == "/api/auth/refresh" && req.post?
  end

  # Return rate limit headers
  Rack::Attack.throttled_responder = lambda do |req|
    match_data = req.env["rack.attack.match_data"]
    headers = {
      "Content-Type" => "application/json",
      "Retry-After" => match_data[:period].to_s
    }
    [429, headers, [{ error: "Rate limit exceeded. Try again later." }.to_json]]
  end
end
