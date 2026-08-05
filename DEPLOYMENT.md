# Deployment Guide — DigitalOcean Droplet

## Prerequisites

- A DigitalOcean droplet (Ubuntu 22.04+, minimum 1GB RAM / 1 vCPU)
- A domain name pointed to the droplet's IP (A record)
- SSH access to the droplet

## 1. Server Setup

SSH into your droplet and install Docker:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

## 2. Clone the Project

```bash
cd /opt
git clone <your-repo-url> website
cd website
```

## 3. Configure Environment

```bash
cp .env.production.example .env
nano .env
```

Fill in every value — here's what each one needs:

| Variable | How to generate |
|---|---|
| `POSTGRES_PASSWORD` | `openssl rand -hex 32` |
| `SECRET_KEY_BASE` | `openssl rand -hex 128` |
| `JWT_SECRET_KEY` | `openssl rand -hex 64` |
| `DOMAIN` | Your domain (e.g. `example.com`) |
| `ALLOWED_ORIGINS` | `https://yourdomain.com` |
| `BACKEND_HOST` | `https://yourdomain.com` |
| `DEFAULT_ADMIN_EMAIL` | Your admin login email |
| `DEFAULT_ADMIN_PASSWORD` | Strong password (change after first login) |
| `SENDGRID_API_KEY` | From SendGrid dashboard (optional at first) |
| `GOOGLE_CLIENT_ID/SECRET` | From Google Cloud Console (optional) |

## 4. Set Your Domain in Nginx

Edit the nginx config and replace `yourdomain.com` with your actual domain (2 places — the SSL certificate paths):

```bash
nano frontend/nginx.conf
```

Find and replace:
```
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

## 5. Build and Start

```bash
# Build all containers
docker compose -f docker-compose.prod.yml build

# Start database first
docker compose -f docker-compose.prod.yml up -d db
sleep 5

# Run migrations and seed
docker compose -f docker-compose.prod.yml run --rm backend bundle exec rails db:create db:migrate db:seed

# Start everything
docker compose -f docker-compose.prod.yml up -d
```

## 6. Set Up SSL (HTTPS)

Make sure your domain's DNS A record points to the droplet IP, then:

```bash
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh yourdomain.com you@email.com
```

This will:
1. Create a temporary dummy certificate so nginx can start
2. Use Let's Encrypt to get a real certificate
3. Reload nginx with the real certificate
4. Auto-renewal runs via the certbot container

Your site is now live at `https://yourdomain.com`.

## 7. First Login

Go to `https://yourdomain.com/login` and sign in with the `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` you set in `.env`.

## Common Operations

### View logs
```bash
docker compose -f docker-compose.prod.yml logs -f           # all
docker compose -f docker-compose.prod.yml logs -f backend   # rails only
docker compose -f docker-compose.prod.yml logs -f frontend  # nginx only
```

### Restart services
```bash
docker compose -f docker-compose.prod.yml restart
```

### Deploy updates
```bash
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm backend bundle exec rails db:migrate
docker compose -f docker-compose.prod.yml up -d
```

### Rails console
```bash
docker compose -f docker-compose.prod.yml exec backend bundle exec rails console
```

### Database backup
```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql
```

### Database restore
```bash
cat backup_file.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U $POSTGRES_USER $POSTGRES_DB
```

### Renew SSL manually (normally auto)
```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec frontend nginx -s reload
```

## Architecture

```
Internet → :80/:443 → nginx (frontend container)
                        ├── Static React files (/, /about, /services, etc.)
                        ├── /api/* → proxy to backend:3000 (Rails)
                        └── /rails/active_storage/* → proxy to backend:3000

backend:3000 → PostgreSQL (db container, no exposed ports)
certbot → auto-renews SSL certificates
```

## Firewall

If using DigitalOcean's firewall (recommended), allow:
- SSH (22)
- HTTP (80) — redirects to HTTPS
- HTTPS (443)

```bash
# Or use ufw on the droplet
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Troubleshooting

**nginx won't start (certificate not found)**
Run `init-letsencrypt.sh` first — nginx needs a certificate (even a dummy one) to start with the SSL config.

**502 Bad Gateway on /api/**
Backend container isn't running. Check `docker compose -f docker-compose.prod.yml logs backend`.

**Migrations fail**
Make sure the db container is running and healthy: `docker compose -f docker-compose.prod.yml ps`.

**Images/uploads not loading**
Check that `BACKEND_HOST` in `.env` matches your actual domain with `https://`.
