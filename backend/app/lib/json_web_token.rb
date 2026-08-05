class JsonWebToken
  SECRET_KEY = ENV['JWT_SECRET_KEY'] || Rails.application.secrets.secret_key_base

  def self.encode(payload, exp = 15.minutes.from_now)
    payload[:exp] = exp.to_i
    payload[:jti] ||= SecureRandom.uuid
    payload[:iat] ||= Time.current.to_i
    JWT.encode(payload, SECRET_KEY, 'HS256')
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: 'HS256' })[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError
    nil
  end
end
