#!/bin/bash

# First-time SSL certificate setup for Let's Encrypt
# Run this ONCE on your server after the first deploy

set -e

DOMAIN="$1"
EMAIL="$2"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: ./init-letsencrypt.sh yourdomain.com you@email.com"
  exit 1
fi

echo "==> Creating dummy certificate for $DOMAIN..."
mkdir -p ./certbot/conf/live/$DOMAIN
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj '/CN=localhost'" certbot

echo "==> Starting nginx with dummy certificate..."
docker compose -f docker-compose.prod.yml up -d frontend

echo "==> Removing dummy certificate..."
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/$DOMAIN && \
  rm -rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

echo "==> Requesting real certificate from Let's Encrypt..."
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN -d www.$DOMAIN \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

echo "==> Reloading nginx with real certificate..."
docker compose -f docker-compose.prod.yml exec frontend nginx -s reload

echo ""
echo "=== SSL setup complete! ==="
echo "Your site is now live at https://$DOMAIN"
echo "Certificates will auto-renew via the certbot container."
