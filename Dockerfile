# Mismo patrón que Mercadito: deps -> builder -> runner, usuario no-root.
# Railway detecta este Dockerfile solo; cada push a main es un deploy.
FROM node:22-alpine AS deps
# libc6-compat: Alpine usa musl y algunos binarios nativos (sharp, swc) lo piden.
# Es lo que trae el Dockerfile oficial de Next.js y aquí faltaba.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Las NEXT_PUBLIC_ se hornean en el paquete del navegador durante el build, no
# se leen al arrancar. Sin estos ARG, Docker no ve las variables de Railway y
# Next las inlinea como `undefined`: el resultado es una app que arranca bien y
# donde nadie puede iniciar sesión, porque el cliente de Supabase sale nulo.
#
# Nos pasó tres veces antes de entenderlo: el sitemap apuntando a localhost, el
# muro de pago que no se podía cerrar y el login roto. Estos ARG arreglan el
# camino normal, pero la app ya no depende de ellos: la configuración del
# cliente baja desde el servidor (ver src/lib/supabase.ts), así que funciona
# aunque el build no vea ninguna variable.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_TELEMETRY_DISABLED=1
# Sin techo explícito, Node ajusta el heap al host y no al límite del contenedor:
# en un builder apretado eso acaba en OOM durante la generación estática.
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build


FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Sin HOSTNAME=0.0.0.0 el contenedor escucha en localhost y Railway lo da por caído.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
