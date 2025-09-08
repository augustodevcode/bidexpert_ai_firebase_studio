# Fase 1: Build da aplicação
FROM node:18-alpine AS builder
WORKDIR /app

# Copia os arquivos de configuração do monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json .

# Copia os pacotes e a app do microserviço
COPY packages/core packages/core
COPY apps/microservice apps/microservice

# Instala dependências usando pnpm
RUN npm install -g pnpm
RUN pnpm install --filter=microservice...

# Executa o build do microserviço
RUN pnpm --filter=microservice build

# Fase 2: Imagem final de produção
FROM node:18-alpine
WORKDIR /app

# Copia o package.json do microserviço e instala apenas as dependências de produção
COPY --from=builder /app/apps/microservice/package.json ./package.json
RUN npm install -g pnpm
RUN pnpm install --prod

# Copia a pasta 'dist' (código compilado) da fase de build
COPY --from=builder /app/apps/microservice/dist ./dist

# Expõe a porta que o serviço vai rodar
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "dist/index.js"]
