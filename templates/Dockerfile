FROM node:8
WORKDIR /app

COPY package*.json ./
# If you want to run a DEVELOPMENT version of metacontroller-framework which is not released to NPM, comment in the next line:
# RUN git clone https://github.com/sandstorm/metacontroller-framework && cd metacontroller-framework && npm install && npm run build && npm link && cd .. && npm link metacontroller-framework
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD [ "npm", "start" ]
