# build environment
FROM node:18-bullseye-slim AS builder
# fix vulnerabilities
ARG NPM_TAG=9.3.1
RUN npm install -g npm@${NPM_TAG}
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
WORKDIR /usr/ldes
# setup to run as less-privileged user
COPY --chown=node:node --from=builder /build/package*.json ./
COPY --chown=node:node --from=builder /build/dist/*.js ./
# env vars
ENV FOLLOW=
ARG SILENT=
ENV SILENT=${SILENT}
ARG MIME_TYPE=
ENV MIME_TYPE=${MIME_TYPE}
ARG POLL_INTERVAL=
ENV POLL_INTERVAL=${POLL_INTERVAL}
# install signal-handler wrapper
RUN apt-get install dumb-init
# set start command
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
# fix vulnerabilities
RUN npm install -g npm@${NPM_TAG}
# install dependancies
ENV NODE_ENV production
RUN npm ci --omit=dev
USER node
CMD ["sh", "-c", "node ./index.js --silent=${SILENT} --mime-type=${MIME_TYPE} --poll-interval=${POLL_INTERVAL} --follow=${FOLLOW}"]
