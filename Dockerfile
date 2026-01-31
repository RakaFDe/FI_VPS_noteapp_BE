# ==========================
# Build stage
# ==========================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

# ==========================
# Runtime stage
# ==========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--enable-source-maps

COPY package*.json ./
COPY VERSION ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Create non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

CMD ["node", "dist/index.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
