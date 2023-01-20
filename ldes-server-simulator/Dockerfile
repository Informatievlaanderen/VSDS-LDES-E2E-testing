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
WORKDIR /usr/vsds/simulator
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
ARG SEED=
ENV SEED=${SEED}
ARG BASEURL=http://localhost
ENV BASEURL=${BASEURL}
## set start command
EXPOSE 80
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
USER node
CMD ["sh", "-c", "node server.js --seed=${SEED} --baseUrl=${BASEURL} --host=0.0.0.0 --port=80"]
