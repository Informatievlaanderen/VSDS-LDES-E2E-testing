#!/bin/sh

export LDI_WORKBENCH_NIFI=docker.io/ldes/ldi-workbench-nifi
export LDI_WORKBENCH_NIFI_TAG=1.12.0-SNAPSHOT
export LDI_ORCHESTRATOR=docker.io/ldes/ldi-orchestrator
export LDI_ORCHESTRATOR_TAG=1.12.0-SNAPSHOT
export LDES_SERVER=docker.io/ldes/ldes-server
export LDES_SERVER_TAG=2.7.0-SNAPSHOT

# deliverables
docker pull $LDI_WORKBENCH_NIFI:$LDI_WORKBENCH_NIFI_TAG
docker pull $LDI_ORCHESTRATOR:$LDI_ORCHESTRATOR_TAG
docker pull $LDES_SERVER:$LDES_SERVER_TAG

# historical deliverables (for upgrade tests)
docker pull ghcr.io/informatievlaanderen/ldes-workbench-nifi:20230124T140316
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:20230324T175226
docker pull ghcr.io/informatievlaanderen/ldes-server:20230405T0843
docker pull ghcr.io/informatievlaanderen/ldes-server:20230802075556

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
docker pull ghcr.io/navikt/mock-oauth2-server:1.0.0
