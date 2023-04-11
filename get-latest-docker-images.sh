#!/bin/sh

# deliverables
docker pull ghcr.io/informatievlaanderen/ldi-workbench-nifi:latest
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:latest
docker pull ghcr.io/informatievlaanderen/ldes-server:latest

# historical deliverables
docker pull ghcr.io/informatievlaanderen/ldes-workbench-nifi:latest

# support
docker pull ghcr.io/informatievlaanderen/ldes-list-fragments:latest
docker pull ghcr.io/informatievlaanderen/ldes-server-simulator:latest
docker pull ghcr.io/informatievlaanderen/mongodb-rest-api:latest
docker pull ghcr.io/informatievlaanderen/test-message-generator:latest
docker pull ghcr.io/informatievlaanderen/test-message-sink:latest

# external
docker pull ghcr.io/julianrojas87/gtfs2ldes-js:latest
docker pull mongo:latest
docker pull nginx:latest
docker pull apache/nifi:latest
