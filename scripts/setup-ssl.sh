#!/bin/bash

# SSL Certificate Setup Script for Nginx
# For production use with Let's Encrypt

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== SSL Certificate Setup ===${NC}"
echo ""

DOMAIN=${1:-$(hostname -f)}

echo "Domain: $DOMAIN"
echo ""

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

echo -e "${YELLOW}Getting SSL certificate for $DOMAIN...${NC}"

# Get certificate
certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN

# Create links for nginx
mkdir -p /etc/nginx/ssl
ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/cert.pem
ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/key.pem

# Set up auto-renewal
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && nginx -t && systemctl reload nginx") | crontab -

echo -e "${GREEN}✓ SSL certificate installed successfully${NC}"
echo -e "${GREEN}✓ Auto-renewal configured (daily at 3 AM)${NC}"

echo ""
echo "Next steps:"
echo "1. Update nginx.conf server_name to: $DOMAIN"
echo "2. Test nginx: nginx -t"
echo "3. Reload nginx: systemctl reload nginx"
