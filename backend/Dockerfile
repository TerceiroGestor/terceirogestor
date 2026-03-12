FROM node:22-alpine
WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm install
COPY . .
RUN npm run build
CMD ["npm","run","start:prod"]
