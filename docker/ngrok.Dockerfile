FROM ngrok/ngrok:latest
# Use COPY with --chmod to set execute bit during build (avoids chmod permission errors)
COPY --chmod=0755 docker/ngrok-entrypoint.sh /ngrok-entrypoint.sh
ENTRYPOINT ["/bin/sh", "/ngrok-entrypoint.sh"]
