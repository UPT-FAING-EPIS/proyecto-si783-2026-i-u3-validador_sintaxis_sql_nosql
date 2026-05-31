FROM node:18-alpine

WORKDIR /app

# Instalar dependencias primero para aprovechar el caché de Docker
COPY package*.json ./
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
