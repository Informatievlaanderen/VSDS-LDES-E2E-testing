# build environment
FROM node:18-bullseye-slim AS builder
# fix vulnerabilities
RUN npm install -g npm@8.17.0
# build it
WORKDIR /build
COPY . .
RUN npm ci
RUN npm run build

# run environment
FROM node:18.12.1-bullseye-slim
# fix vulnerabilities
# note: trivy insists this to be on the same RUN line
RUN apt-get update && apt-get upgrade
WORKDIR /usr/vsds/sink
# setup to run as less-privileged user
COPY --chown=node:node --from=builder /build/package*.json ./
COPY --chown=node:node --from=builder /build/dist/*.js ./
# env vars
ARG CONNECTION_URI
ENV CONNECTION_URI=${CONNECTION_URI}
ENV SILENT=
ENV MEMBER_TYPE=
ENV DATABASE_NAME=
ENV COLLECTION_NAME=
ENV MEMORY=
# install signal-handler wrapper
RUN apt-get install dumb-init
# set start command
EXPOSE 80
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
# fix vulnerabilities
RUN npm install -g npm@8.17.0
# install dependancies
ENV NODE_ENV production
RUN npm ci --omit=dev
USER node
CMD ["sh", "-c", "node ./server.js --host=0.0.0.0 --port=80 --memory=${MEMORY} --silent=${SILENT} --member-type=${MEMBER_TYPE} --connection-uri=${CONNECTION_URI} --database-name=${DATABASE_NAME} --collection-name=${COLLECTION_NAME}"]
