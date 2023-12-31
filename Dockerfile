FROM node:alpine
LABEL org.opencontainers.image.source https://github.com/pb-coding/voltvector-be

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma/

COPY tsconfig.json ./

COPY . .

RUN npm install

RUN npm run build

EXPOSE 3001

CMD sh -c "npx prisma migrate dev && npx prisma db seed && npm start"