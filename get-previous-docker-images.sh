#!/bin/sh

# deliverables
docker pull ghcr.io/informatievlaanderen/ldi-workbench-nifi:20230407T130526
docker pull ghcr.io/informatievlaanderen/ldi-orchestrator:20230407T130529
docker pull ghcr.io/informatievlaanderen/ldes-server:20230407T1308

# historical deliverables
docker pull ghcr.io/informatievlaanderen/ldes-workbench-nifi:20230214T123440

# support
docker pull ghcr.io/informatievlaanderen/ldes-list-fragments:20230411T1222
docker pull ghcr.io/informatievlaanderen/ldes-server-simulator:20230411T1225
docker pull ghcr.io/informatievlaanderen/mongodb-rest-api:20230411T0829
docker pull ghcr.io/informatievlaanderen/test-message-generator:20230406T0837
docker pull ghcr.io/informatievlaanderen/test-message-sink:20230411T0354

# external
docker pull ghcr.io/julianrojas87/gtfs2ldes-js:20230306t2329
docker pull mongo:6.0.5
docker pull nginx:1.23.4
docker pull apache/nifi:1.21.1
