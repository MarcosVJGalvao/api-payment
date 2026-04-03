FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends tzdata ca-certificates procps \
    && ln -fs /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev \
    && npm install -g pm2 \
    && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/swagger/portal/assets ./src/swagger/portal/assets
COPY --from=builder /app/src/swagger/portal/templates ./src/swagger/portal/templates
RUN node -e "require.resolve('@scalar/api-reference')"
RUN test -f node_modules/@scalar/api-reference/dist/browser/standalone.js
COPY docker/api-entrypoint.sh /api-entrypoint.sh

RUN chmod +x /api-entrypoint.sh

EXPOSE 3000

CMD ["/api-entrypoint.sh"]
