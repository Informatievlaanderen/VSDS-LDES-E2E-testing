# build environment
FROM node:18 AS builder
# fix vulnerabilities
RUN npm install -g npm@8.17.0
# build it
WORKDIR /build
COPY . .
RUN npm ci
RUN npm run build

# run environment
FROM node:18.2.0-alpine3.15
WORKDIR /usr/vsds/sink
# fix vulnerabilities
RUN npm install -g npm@8.17.0
RUN apk update & apk upgrade
## setup to run as less-privileged user
COPY --chown=node:node --from=builder /build/package*.json ./
COPY --chown=node:node --from=builder /build/dist/*.js ./
## install dependancies
ENV NODE_ENV production
RUN npm ci --omit=dev
## install signal-handler wrapper
RUN apk add dumb-init
## env vars
ARG CONNECTION_URI
ENV CONNECTION_URI=${CONNECTION_URI}
ENV SILENT=
ENV MEMBER_TYPE=
ENV DATABASE_NAME=
ENV COLLECTION_NAME=
## set start command
EXPOSE 80
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
USER node
CMD ["sh", "-c", "node ./server.js --host=0.0.0.0 --port=80 --silent=${SILENT} --member-type=${MEMBER_TYPE} --connection-uri=${CONNECTION_URI} --database-name=${DATABASE_NAME} --collection-name=${COLLECTION_NAME}"]
