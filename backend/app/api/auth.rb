class Auth < Grape::API
  format :json
  helpers CookieAuth

  resource :auth do
    desc 'Authenticate user and return JWT token'
    params do
      requires :email, type: String, desc: 'User email address'
      requires :password, type: String, desc: 'User password'
    end
    post '/login' do
      user = User.find_by(email: params[:email])

      unless user&.authenticate(params[:password])
        AuditLog.log(
          action: 'login_failed',
          details: { email: params[:email] },
          request: request
        )
        error!({ error: 'Invalid email or password' }, 401)
      end

      access_token = JsonWebToken.encode(user_id: user.id)
      set_access_token_cookie(access_token)

      raw_refresh = RefreshToken.generate_for(user, request: request)
      set_refresh_token_cookie(raw_refresh)

      AuditLog.log(action: 'login_success', user: user, request: request)

      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'admin',
          is_admin: true
        }
      }
    end

    desc 'Refresh access token using refresh token cookie'
    post '/refresh' do
      raw_refresh = cookies[:refresh_token]
      error!({ error: 'No refresh token' }, 401) unless raw_refresh

      refresh_record = RefreshToken.find_by_raw_token(raw_refresh)
      error!({ error: 'Invalid or expired refresh token' }, 401) unless refresh_record

      user = refresh_record.user

      access_token = JsonWebToken.encode(user_id: user.id)
      set_access_token_cookie(access_token)

      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'admin',
          is_admin: true
        }
      }
    end

    desc 'Verify access token and return user data'
    get '/verify' do
      token = cookies[:access_token]
      unless token
        auth_header = headers['Authorization']
        token = auth_header.split(' ').last if auth_header
      end

      error!({ error: 'No token provided' }, 401) unless token

      decoded = JsonWebToken.decode(token)
      error!({ error: 'Invalid or expired token' }, 401) unless decoded

      user = User.find_by(id: decoded[:user_id])
      error!({ error: 'User not found' }, 404) unless user

      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'admin',
          is_admin: true
        }
      }
    end

    desc 'Logout user - revoke refresh token and clear cookies'
    post '/logout' do
      raw_refresh = cookies[:refresh_token]
      if raw_refresh
        refresh_record = RefreshToken.find_by_raw_token(raw_refresh)
        refresh_record&.revoke!
      end

      token = cookies[:access_token]
      if token
        decoded = JsonWebToken.decode(token)
        user = User.find_by(id: decoded[:user_id]) if decoded
      end

      AuditLog.log(action: 'logout', user: user, request: request)

      clear_auth_cookies

      { success: true, message: 'Logged out successfully' }
    end
  end
end
