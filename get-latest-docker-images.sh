#!/bin/sh

# deliverables
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:latest
docker pull ghcr.io/informatievlaanderen/ldes-server:latest

# historical deliverables (for upgrade tests)
docker pull ghcr.io/informatievlaanderen/ldes-workbench-nifi:20240405122246
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:20230324T175226
docker pull ghcr.io/informatievlaanderen/ldes-server:20230405T0843
docker pull ghcr.io/informatievlaanderen/ldes-server:20230802075556

# support
docker pull ghcr.io/informatievlaanderen/ldes-server-simulator:latest
docker pull ghcr.io/informatievlaanderen/mongodb-rest-api:latest
docker pull ghcr.io/informatievlaanderen/test-message-generator:latest
docker pull ghcr.io/informatievlaanderen/test-message-sink:latest

# external
docker pull ghcr.io/julianrojas87/gtfs2ldes-js:latest
docker pull mongo:latest
docker pull nginx:stable
docker pull apache/nifi:latest
docker pull ghcr.io/navikt/mock-oauth2-server:1.0.0
