# API Payments

## Docker

This repository includes a multi-container Docker runtime that starts:

- the NestJS API in its own container, managed by `pm2-runtime`
- `nginx` as a dedicated reverse proxy container
- `ngrok` as a dedicated tunnel container
- `redis` as a dedicated cache/queue container

Network topology:

- `backend_net`: `api-payments`, `redis`, `nginx`
- `edge_net`: `nginx`, `ngrok`

The official external URL for the API should be the reserved ngrok domain configured in `APP_PUBLIC_BASE_URL`.

### Required environment variables

Copy `.env.example` to `.env` and fill at least:

```bash
PORT=3000
HOST_HTTP_PORT=8080
NODE_ENV=production
TRUST_PROXY=1
JWT_SECRET=your-jwt-secret
NGROK_DOMAIN=your-reserved-domain.ngrok-free.app
NGROK_AUTHTOKEN=your-ngrok-token
```

The Docker entrypoint also accepts `TOKEN_NGROK` as a legacy alias for `NGROK_AUTHTOKEN`.
If `APP_PUBLIC_BASE_URL` is not set, the API container derives it automatically as `https://${NGROK_DOMAIN}`.
The `nginx` proxy reads the same `PORT` value from `.env`, so the container stack stays aligned with the API runtime.
Docker Compose also reads `HOST_HTTP_PORT` from `.env` for the local host binding.

### Redis behavior inside Docker

This Compose file includes a Redis container on the same Docker network.

For the default bundled setup, use:

```bash
REDIS_HOST=redis
REDIS_PORT=6379
```

The API will then reach Redis by the Docker service name on the same server.

If `REDIS_HOST=localhost`, the API container rewrites it to `host.docker.internal` so you can still point to a Redis instance running on the Docker host.

If `REDIS_HOST` is empty, the API defaults to the bundled `redis` service.

The bundled Redis service is limited through environment variables:

```bash
REDIS_MAX_MEMORY=128mb
REDIS_MAX_MEMORY_POLICY=allkeys-lru
```

It also uses `REDIS_PASSWORD` for authentication.

### Run with Docker Compose

```bash
docker compose build
docker compose up
```

The container exposes the application locally at `http://localhost:${HOST_HTTP_PORT}`, while ngrok publishes the reserved public domain.

### How updates work

When you change the API code, rebuild and recreate only the API service:

```bash
docker compose up -d --build api-payments
```

If your change affects nginx or the full stack, rebuild the affected services or everything:

```bash
docker compose up -d --build
```

`pm2-runtime` runs inside the API container as the process manager, but container updates still happen by rebuilding and recreating the container image.

### Security notes

- `nginx` blocks hidden files such as `/.env` and `/.git`
- dangerous executable-like extensions such as `.php`, `.asp`, `.py`, `.sh`, and similar are denied
- `/` returns `404`
- `/docs` uses a dedicated Content Security Policy to keep Scalar working
- the Nest app enables `trust proxy` with depth `1` so forwarded protocol and client IP are interpreted correctly behind `nginx`

## Local Node workflow

```bash
npm install
npm run build
npm run start:prod
```

## Tests

```bash
npm run test
npm run test:e2e
```
