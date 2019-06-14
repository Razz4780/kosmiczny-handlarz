FROM node:10.16.0
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm install
COPY tsconfig.json /app/tsconfig.json
COPY tsconfig_front.json /app/tsconfig_front.json
COPY public /app/public
COPY src /app/src
COPY front /app/front
RUN npm run tsc
ENTRYPOINT ["npm", "run", "serve"]
