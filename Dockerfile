FROM node:18-alpine

WORKDIR /app

# Instalar dependencias primero para aprovechar el caché de Docker
COPY package*.json ./
RUN npm install --production

# Copiar el resto del código
COPY --chown=node:node . .

# Directorio de subida de archivos (multer) con permisos para el usuario no root
RUN mkdir -p uploads && chown node:node uploads

USER node

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
