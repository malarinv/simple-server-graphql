FROM node:alpine

RUN mkdir -p /app
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install --only=production && npm cache clean --force

COPY build /app/build/

USER node
EXPOSE 4000

CMD ["npm","run","start:prod"]
