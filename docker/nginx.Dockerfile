FROM nginx:1.27-alpine
RUN apk add --no-cache gettext
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
CMD ["/bin/sh", "-c", "envsubst '$NGROK_DOMAIN $PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'" ]
