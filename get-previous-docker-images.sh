#!/bin/sh

# deliverables
docker pull ghcr.io/informatievlaanderen/ldi-workbench-nifi:20230508T085634
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:20230508T085639
docker pull ghcr.io/informatievlaanderen/ldes-server:20230505T0853

# historical deliverables
docker pull ghcr.io/informatievlaanderen/ldes-workbench-nifi:20230412T141138

# support
docker pull ghcr.io/informatievlaanderen/ldes-list-fragments:20230502T1216
docker pull ghcr.io/informatievlaanderen/ldes-server-simulator:20230502T1216
docker pull ghcr.io/informatievlaanderen/mongodb-rest-api:20230502T1217
docker pull ghcr.io/informatievlaanderen/test-message-generator:20230502T1217
docker pull ghcr.io/informatievlaanderen/test-message-sink:20230502T1216

# external
docker pull ghcr.io/julianrojas87/gtfs2ldes-js:20230306t2329
docker pull mongo:6.0.5
docker pull nginx:1.24.0
docker pull apache/nifi:1.21.0
