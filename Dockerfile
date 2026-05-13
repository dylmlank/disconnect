FROM node:20-slim

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/

# Install dependencies
RUN npm ci --workspace=shared --workspace=server

# Copy source
COPY shared/ shared/
COPY server/ server/
COPY landing/ landing/

# Build shared types
RUN npm run build --workspace=shared

# Build server
RUN npm run build --workspace=server

# Run migrations and start
EXPOSE 3000
ENV NODE_ENV=production

CMD ["sh", "-c", "cd server && npx knex migrate:latest --knexfile knexfile.ts && node dist/index.js"]
