# ==========================
# Build stage
# ==========================
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy tsconfig
COPY tsconfig*.json ./

# Copy source code (TERMUK MASUK src/shared)
COPY src ./src

# Build TypeScript
RUN npm run build

# ==========================
# Runtime stage
# ==========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy build output
COPY --from=build /app/dist ./dist
COPY package*.json ./

# Install production deps only
RUN npm ci --omit=dev

EXPOSE 3000

CMD ["node", "dist/index.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
