# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
# The lockfile has to come along for `npm ci` to be usable at all. Without it,
# `npm install` re-resolves the tree on every build, so the image can pick up a
# different transitive version than CI tested against.
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so this
# must be a build ARG (not just a container-runtime env var) to take effect.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# The generated standalone server does `process.env.HOSTNAME || '0.0.0.0'`, so
# the fallback is fine - the problem is that the fallback never applies. Docker
# sets HOSTNAME in every container to the container id, so Next resolves that
# and listens on the single interface it maps to rather than on all of them. A
# proxy reaching the container by any other address then gets nothing, which
# surfaces as a 502 while the port still looks open to a port scan. Setting it
# explicitly is what Next's own Docker example does, for this reason.
ENV HOSTNAME="0.0.0.0"
# Render injects its own PORT at runtime and that wins; this only keeps the
# container consistent with EXPOSE below when nothing sets it.
ENV PORT=3000

RUN addgroup -S aegiszero && adduser -S aegiszero -G aegiszero
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER aegiszero
EXPOSE 3000
ENTRYPOINT ["node", "server.js"]
