FROM node:10.16.0
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm install
COPY tsconfig.json /app/tsconfig.json
COPY public /app/public
COPY src /app/src
RUN npm run tsc
ENTRYPOINT ["npm", "run", "serve"]
