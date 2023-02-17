FROM node:18.14.0-buster-slim

WORKDIR /scrappers/

COPY package.json package-lock.json ./

RUN yarn install

COPY . .
