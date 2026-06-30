# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:22-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache libstdc++ \
    && addgroup -S app \
    && adduser -S app -G app \
    && mkdir -p /logs \
    && chown -R app:app /app /logs

COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --chown=app:app package*.json ./

USER app

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -q --spider http://localhost:3000/api/v1/health || exit 1

CMD ["npm", "run", "start:prod"]
