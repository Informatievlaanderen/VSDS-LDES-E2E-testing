#!/bin/sh

# deliverables
docker pull ghcr.io/informatievlaanderen/ldi-workbench-nifi:20230704080200
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:20230704080159
docker pull ghcr.io/informatievlaanderen/ldes-server:20230703153349

# historical deliverables (for upgrade tests)
docker pull ghcr.io/informatievlaanderen/ldes-workbench-nifi:20230124T140316
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:20230324T175226
docker pull ghcr.io/informatievlaanderen/ldes-server:20230405T0843

# support
docker pull ghcr.io/informatievlaanderen/ldes-list-fragments:20230502T1216
docker pull ghcr.io/informatievlaanderen/ldes-server-simulator:20230502T1216
docker pull ghcr.io/informatievlaanderen/mongodb-rest-api:20230629T1832
docker pull ghcr.io/informatievlaanderen/test-message-generator:20230502T1217
docker pull ghcr.io/informatievlaanderen/test-message-sink:20230502T1216

# external
docker pull ghcr.io/julianrojas87/gtfs2ldes-js:20230306T2329
docker pull mongo:6.0.5
docker pull nginx:1.24.0
docker pull apache/nifi:1.21.0
