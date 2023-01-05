# build environment
FROM node:18-bullseye-slim AS builder
# fix vulnerabilities
RUN npm install -g npm@9.2.0
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
WORKDIR /usr/vsds/generator
# fix vulnerabilities
RUN npm install -g npm@9.2.0
## setup to run as less-privileged user
COPY --chown=node:node --from=builder /build/package*.json ./
COPY --chown=node:node --from=builder /build/dist ./
## install dependancies
ENV NODE_ENV production
RUN npm ci --omit=dev
## install signal-handler wrapper
RUN apt-get install dumb-init
## allow passing variables
ARG SILENT=true
ENV SILENT=${SILENT}
ARG TARGETURL=
ENV TARGETURL=${TARGETURL}
ARG CRON=
ENV CRON=${CRON}
ARG TEMPLATEFILE=
ENV TEMPLATEFILE=${TEMPLATEFILE}
ARG MAPPINGFILE=
ENV MAPPINGFILE=${MAPPINGFILE}
ARG TEMPLATE=
ENV TEMPLATE=${TEMPLATE}
ARG MAPPING=
ENV MAPPING=${MAPPING}
## set start command
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
USER node
CMD ["sh", "-c", "node index.js --silent=${SILENT} --targetUrl=${TARGETURL} --cron=\"${CRON}\" --mapping=\"${MAPPING}\" --mappingFile=${MAPPINGFILE} --template=\"${TEMPLATE}\" --templateFile=${TEMPLATEFILE}"]
