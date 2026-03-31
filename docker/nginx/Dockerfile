FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

COPY entrypoint.sh /entrypoint.sh
COPY templates /etc/nginx/templates

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
