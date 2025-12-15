FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 10000

CMD ["sh", "-c", "node backend/pg/migrate.js && node backend/pg/server.js"]
