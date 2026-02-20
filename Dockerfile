# ── Stage 1: Build ────────────────────────────────────────
FROM node:22-alpine AS build

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen lockfile for reproducible builds)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build the SPA
RUN pnpm build

# ── Stage 2: Serve ────────────────────────────────────────
FROM nginx:1.28-alpine AS runtime

# Upgrade all Alpine packages to pick up security patches
RUN apk upgrade --no-cache

# Remove default nginx config and html
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Add hardened nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from build stage
COPY --from=build /app/dist/client /usr/share/nginx/html

# TanStack Start SPA outputs _shell.html — rename to index.html for nginx
RUN mv /usr/share/nginx/html/_shell.html /usr/share/nginx/html/index.html

# Run as non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
