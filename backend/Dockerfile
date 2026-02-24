FROM node:20-alpine
WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm install
COPY . .
RUN npm run build
CMD ["npm","run","start:prod"]
