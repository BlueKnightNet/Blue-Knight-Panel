# Production Dockerfile for BlueKnight Universal Deployment
# Compatible with Fly.io, Railway, Render, Koyeb, and Docker Compose
FROM node:24-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/data

# Copy application files
COPY package.json ./
COPY server.js ./
COPY lib/ ./lib/
COPY worker.js ./
COPY public/ ./public/

# Create data directory for persistent KV storage
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
