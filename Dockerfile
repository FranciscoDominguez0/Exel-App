FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY server.js ./
COPY public/ ./public/

EXPOSE 80

CMD ["npm", "start"]
