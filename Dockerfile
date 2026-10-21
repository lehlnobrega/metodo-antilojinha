# App do Método: imagem para rodar na Easypanel (ou qualquer servidor com Docker).
# Etapa 1: instala e gera o build
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . .
# Gera o servidor em Node (fora do Lovable o padrão seria Cloudflare)
ENV NITRO_PRESET=node-server
RUN npm run build

# Etapa 2: imagem final, só com o que precisa pra rodar
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
