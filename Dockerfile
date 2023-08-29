FROM node:18
LABEL org.opencontainers.image.source https://github.com/pb-coding/voltvector-be

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]