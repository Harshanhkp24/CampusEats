# Cluster Deployment (Backend + Nginx)

This setup runs two backend replicas behind Nginx load balancing.

## Prerequisites

- Docker + Docker Compose
- Valid `backend/.env` with `MONGO_URI`, `JWT_SECRET`, `PORT` (optional)

## Start

```bash
docker compose -f deploy/docker-compose.cluster.yml up --build -d
```

Nginx entrypoint: `http://localhost:8080`

API proxied path: `http://localhost:8080/api/*`

## Stop

```bash
docker compose -f deploy/docker-compose.cluster.yml down
```
