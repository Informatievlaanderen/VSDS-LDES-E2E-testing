#!/bin/sh

# deliverables
docker pull ghcr.io/informatievlaanderen/ldi-workbench-nifi:20230328t074157
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:20230328T074159
docker pull ghcr.io/informatievlaanderen/ldes-server:20230328T0756

# obsolete deliverables
docker pull ghcr.io/informatievlaanderen/ldes-workbench-nifi:20230214T123440
docker pull ghcr.io/informatievlaanderen/ldes-cli:20230222T0959

# support
docker pull ghcr.io/informatievlaanderen/json-data-generator:20230329T1705
docker pull ghcr.io/informatievlaanderen/ldes-server-simulator:20230329T1705
docker pull ghcr.io/informatievlaanderen/ldes-client-sink:20230329T1706
docker pull ghcr.io/informatievlaanderen/ldes-list-fragments:20230329T1705
docker pull ghcr.io/informatievlaanderen/mongodb-rest-api:20230329T1705

# external
docker pull ghcr.io/julianrojas87/gtfs2ldes-js:20230306t2329
docker pull mongo:6.0.4
docker pull nginx:1.23.3
docker pull apache/nifi:1.19.1
