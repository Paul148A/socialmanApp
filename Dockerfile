# Etapa 1: Construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json y lock para instalar dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo dev para build)
RUN npm install

# Copiar el resto del código
COPY . .

# Compilar el proyecto NestJS
RUN npm run build

# Etapa 2: Producción
FROM node:18-alpine AS production

WORKDIR /app

# Copiar solo los archivos necesarios de producción
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --only=production

# Copiar la carpeta compilada dist/ desde la etapa de build
COPY --from=builder /app/dist ./dist

# Copiar otros archivos necesarios (por ejemplo assets o views)
COPY --from=builder /app/node_modules ./node_modules

# Puerto de la app (NestJS por defecto usa 3000)
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main.js"]
