#!/bin/sh
set -e

TEMPLATE_HTTP="/etc/nginx/templates/app.http.conf.template"
TEMPLATE_HTTPS="/etc/nginx/templates/app.https.conf.template"
CONF="/etc/nginx/conf.d/app.conf"
CERT="/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem"

if [ -f /etc/nginx/conf.d/default.conf ]; then
  rm -f /etc/nginx/conf.d/default.conf
fi

render() {
  envsubst '${SERVER_NAME} ${PRIMARY_DOMAIN}' < "$1" > "$CONF"
}

if [ -f "$CERT" ]; then
  render "$TEMPLATE_HTTPS"
else
  render "$TEMPLATE_HTTP"
fi

(
  while true; do
    if [ -f "$CERT" ]; then
      if ! grep -q "listen 443" "$CONF"; then
        render "$TEMPLATE_HTTPS"
        nginx -s reload
      fi
    fi
    sleep 30
  done
) &

exec nginx -g "daemon off;"
