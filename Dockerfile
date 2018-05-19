FROM node:alpine

RUN mkdir -p /app
WORKDIR /app
COPY package.json package-lock.json /app/

RUN NPM_CONFIG_CACHE=/dev/shm/npm_cache npm install --only=production

COPY build /app/build/

USER node
EXPOSE 4000

CMD ["npm","run","start:prod"]
