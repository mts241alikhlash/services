# syntax=docker/dockerfile:1
FROM node:24.20.0-alpine AS build
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/ ./services/
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm --filter academic-service prisma:generate && pnpm --filter academic-service build
RUN pnpm --filter academic-service deploy --prod --legacy /out

FROM node:24.20.0-alpine AS runner
WORKDIR /app
COPY --from=build --chown=node:node /out/ ./
USER node
EXPOSE 3200
CMD ["node", "dist/src/main.js"]
