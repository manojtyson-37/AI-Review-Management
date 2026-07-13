FROM node:18-alpine AS base

# This Dockerfile is optimized for NestJS production deployment
FROM base AS builder
# Set working directory
WORKDIR /app
# Install turbo globally
RUN npm install -g turbo
COPY . .
# Run turbo prune
RUN turbo prune --scope=api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci
COPY --from=builder /app/out/full/ .
# Generate Prisma Client
RUN cd apps/api && npx prisma generate
RUN npm run build --filter=api

FROM base AS runner
WORKDIR /app
COPY --from=installer /app .
EXPOSE 3001
CMD [ "npm", "run", "start:prod", "--filter=api" ]
