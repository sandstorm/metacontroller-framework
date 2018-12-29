FROM node:8
WORKDIR /app

COPY package*.json ./
# If you want to run a DEVELOPMENT version of metacontroller-framework which is not released to NPM, comment in the next line:
# RUN cd / && git clone https://github.com/sandstorm/metacontroller-framework && cd /metacontroller-framework && npm install && npm run build && npm link && cd /app && npm link metacontroller-framework && rm -Rf package-lock.json
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 8080
CMD [ "npm", "start" ]
