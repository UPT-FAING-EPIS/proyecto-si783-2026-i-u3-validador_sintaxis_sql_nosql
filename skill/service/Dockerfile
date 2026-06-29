FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY openapi.yaml ./openapi.yaml
COPY .env.example ./.env.example

EXPOSE 4000

CMD ["node", "src/server.js"]
