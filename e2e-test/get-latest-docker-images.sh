#!/bin/sh

# deliverables
docker pull ghcr.io/informatievlaanderen/ldi-workbench-nifi:latest
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:latest
docker pull ghcr.io/informatievlaanderen/ldes-server:latest

# obsolete deliverables
docker pull ghcr.io/informatievlaanderen/ldes-workbench-nifi:latest
docker pull ghcr.io/informatievlaanderen/ldes-cli:latest

# support
docker pull ghcr.io/informatievlaanderen/json-data-generator:latest
docker pull ghcr.io/informatievlaanderen/ldes-server-simulator:latest
docker pull ghcr.io/informatievlaanderen/ldes-client-sink:latest
docker pull ghcr.io/informatievlaanderen/ldes-list-fragments:latest
docker pull ghcr.io/informatievlaanderen/mongodb-rest-api:latest

# external
docker pull ghcr.io/julianrojas87/gtfs2ldes-js:latest
docker pull mongo:latest
docker pull nginx:latest
docker pull apache/nifi:latest
