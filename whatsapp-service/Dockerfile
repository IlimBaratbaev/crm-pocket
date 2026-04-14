FROM node:20-alpine

WORKDIR /app

# Install build deps for native modules (Baileys uses bufferutil, utf-8-validate)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev || true
# Install all deps for build then prune
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Remove dev deps after build
RUN npm prune --omit=dev

EXPOSE 3001

CMD ["node", "dist/index.js"]
