# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare yarn@4.9.4 --activate
WORKDIR /app

# Builder stage - copy everything and build
FROM base AS builder

# Copy entire monorepo
COPY . .

# Install dependencies
RUN yarn install

# Build packages in order (dependencies first)
RUN yarn workspace portfolioly-schema build
RUN yarn workspace portfolioly-template-components build

# Build the main app (uses .env.production automatically)
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn workspace main build

# Clean up env files from builder (not needed in final image anyway, but good practice)
RUN rm -f apps/main/.env.production apps/main/.env

# Production image - minimal runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the standalone output (includes all bundled dependencies)
COPY --from=builder /app/apps/main/.next/standalone ./
COPY --from=builder /app/apps/main/.next/static ./apps/main/.next/static
COPY --from=builder /app/apps/main/public ./apps/main/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/main/server.js"]
