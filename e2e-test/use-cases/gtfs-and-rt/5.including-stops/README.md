# LDES Server Offers a Geospatial View on GTFS/RT (e.g. De Lijn)
This test validates user story **Ingest GTFS-RT De Lijn for acceptance** (VSDSPUB-299).

### Test Setup
For this scenario we can use the a [custom context](./docker-compose.yml) derived from [GTFS2LDES / Workflow / Server / Mongo](../../../support/context/gtfs2ldes-workflow-server-mongo/README.md) context. Please copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and fill in the mandatory arguments and append the specific `<gtfs-use-case>.env` file to your personal file.

> **Note**: for the [GTFS(RT) data from De Lijn](https://data.delijn.be/) you will need to request a subcription and then you will receive an API (authentication) key which is required to receive the realtime changes.

Then you can create the images and run all systems (except the gtfs2ldes-js system which should be started at a later time) by executing the following command:
```bash
docker compose --env-file user.env up -d
```
> **Note**: it may take a minute for all the servers to start.

> **Note**: that the GTFS2LDES service is assigned to an arbitrary profile named `delayed-start` to prevent it from starting immediately.

### Test Execution
To run the test, you need to:
1. Upload a pre-defined NiFi workflow containing a ListenHTTP (to listen for POSTed GTFS data) and a InvokeHTTP processor (to send the LDES members to the LDES server) and start it.
2. Start the GTFS to LDES convertor and wait for it to start sending GTFS data (connections).
3. Verify that LDES members are being received by the LDES-server and the correct fragments are being created.

#### 1. Upload NiFi Workflow
Browse to the Apache NiFi user interface (https://localhost:8443/nifi) and create a new process group based on the [workflow](./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).

Verify that the ListenHTTP processor (http://localhost:9005/gtfs/healthcheck) is listening for incoming GTFS/RT members:
```bash
curl http://localhost:9005/gtfs/healthcheck
```

#### 2. Start the GTFS to LDES convertor
Start the GTFS to LDES convertor as described [here](../../../support/context/gtfs2ldes-workflow-server-mongo/README.md#start-the-gtfs-to-ldes-convertor) and watch its Docker logs to know when it starts sending GTFS connections to the workflow.

To start the GTFS to LDES convertor:
```bash
docker compose --env-file user.env up gtfs2ldes-js -d
```
Verify that the GTFS to LDES convertor is processing the GTFS or GTFS/RT source.

#### 3. Verify LDES Members Received And Fragments Created
To ensure GTFS connections are being received by the LDES-server you can use the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `ldesmember` document collection contains the LDES members (check the document count).
> **Note**: that we store the document collection in a database as configured in the Docker environment argument `SPRING_DATA_MONGODB_DATABASE`.

In addition, you can request the members from the LDES you specified (Docker environment variable `LDES_COLLECTIONNAME`- http://localhost:8080/connections) and follow the `tree:view` URI to the geospatial root tile, OR directly query the view (Docker environment variable `VIEWS_0_NAME` - http://localhost:8080/connections/by-location-and-time) and follow the `tree:node` to the geospatial tile root, OR even get the geospatial root tile directly (http://localhost:8080/connections/by-location-and-time?tile=0/0/0), e.g.:
```bash
curl http://localhost:8080/connections
curl http://localhost:8080/connections/by-location-and-time
curl http://localhost:8080/connections/by-location-and-time?tile=0/0/0
```

> **Note** that the root tile fragment only exists after the first member is ingested.

Because the LDES server is configured to fragment the members geospatially and then by time, the structure created is a geospatial (search) tree with three levels: the root tile node, the tile nodes at the specified level (e.g. level 15) and the linked list of timebased fragments below these non-root tile nodes. The tile nodes only contain relations, while the timebased fragments each contain a maximum number (e.g. 100) of members and a link to the next (newer) fragment.

### Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/gtfs2ldes-workflow-server-mongo/README.md#stop-the-systems), i.e.:
```bash
docker compose --env-file user.env stop gtfs2ldes-js
docker compose --env-file user.env --profile delay-started down
```
