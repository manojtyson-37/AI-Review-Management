FROM node:18-alpine AS base

# This Dockerfile is optimized for Next.js production deployment
FROM base AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci
COPY --from=builder /app/out/full/ .
RUN npm run build --filter=web

FROM base AS runner
WORKDIR /app
COPY --from=installer /app .
EXPOSE 3000
CMD [ "npm", "run", "start", "--filter=web" ]
