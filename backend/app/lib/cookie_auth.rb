module CookieAuth
  extend Grape::API::Helpers

  COOKIE_BASE = {
    httponly: true,
    same_site: :lax
  }.freeze

  def set_access_token_cookie(token)
    cookies[:access_token] = COOKIE_BASE.merge(
      value: token,
      expires: 15.minutes.from_now,
      secure: Rails.env.production?,
      path: '/api'
    )
  end

  def set_refresh_token_cookie(token)
    cookies[:refresh_token] = COOKIE_BASE.merge(
      value: token,
      expires: 7.days.from_now,
      secure: Rails.env.production?,
      path: '/api/auth'
    )
  end

  def clear_auth_cookies
    cookies.delete(:access_token, path: '/api')
    cookies.delete(:refresh_token, path: '/api/auth')
  end
end
