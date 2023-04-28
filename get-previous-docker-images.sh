#!/bin/sh

# deliverables
docker pull ghcr.io/informatievlaanderen/ldi-workbench-nifi:20230424T152652
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:20230419T081024
docker pull ghcr.io/informatievlaanderen/ldes-server:20230424T0954

# historical deliverables
docker pull ghcr.io/informatievlaanderen/ldes-workbench-nifi:20230214T123440

# support
docker pull ghcr.io/informatievlaanderen/ldes-list-fragments:20230417T1447
docker pull ghcr.io/informatievlaanderen/ldes-server-simulator:20230417T1451
docker pull ghcr.io/informatievlaanderen/mongodb-rest-api:20230418T1946
docker pull ghcr.io/informatievlaanderen/test-message-generator:20230421T1043
docker pull ghcr.io/informatievlaanderen/test-message-sink:20230417T1510

# external
docker pull ghcr.io/julianrojas87/gtfs2ldes-js:20230306t2329
docker pull mongo:6.0.5
docker pull nginx:1.24.0
docker pull apache/nifi:1.21.0
