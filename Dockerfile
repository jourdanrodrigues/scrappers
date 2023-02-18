FROM node:18.14.0

WORKDIR /scrappers/

RUN npm install -g npm

COPY package.json yarn.lock ./

RUN yarn install

COPY . .
