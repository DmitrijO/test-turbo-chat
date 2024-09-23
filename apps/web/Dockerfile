
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_51PuqvLH78kIalckfUnZYAwB7FTRAtpbBpauK2RoSeK6UZHOf74Pchc9PDliJcAwQatXGrCJZFilnRwApvto6ugxE00w61ZnGRO
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
