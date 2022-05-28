# build environment
FROM node:18 AS builder
WORKDIR /build
COPY . .
RUN npm ci
RUN npm run build

# run envirnment
FROM node:18.2.0-alpine3.15
WORKDIR /usr/vsds/sink
## setup to run as less-privileged user
COPY --chown=node:node --from=builder /build/package*.json .
COPY --chown=node:node --from=builder /build/dist/*.js .
## install dependancies
ENV NODE_ENV production
RUN npm ci --omit=dev
## install signal-handler wrapper
RUN apk add dumb-init
## set start command
EXPOSE 80
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
USER node
CMD ["sh", "-c", "node ./server.js --host=0.0.0.0 --port=80"]
