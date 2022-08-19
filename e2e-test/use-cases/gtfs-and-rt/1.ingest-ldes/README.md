# LDES Server Can Ingest GTFS/RT
This test validates user story **Publish Linked Connections Event Stream** (VSDSPUB-208) and was shown during demo 1 on August, 2nd 2022.

## Scenario: Ingest a Small GTFS Test Data Set
This scenario verifies that the LDES server can ingest GTFS (in addition to GIPOD mobility hindrances).
```gherkin
Given a GTFS data set with a single route, a couple of stops and a single trip
When the gtfs2ldes services is started initially
Then that service should POST all Linked Connections Event Stream members for the whole data set to the LDES server
```

## Scenario: Updating the Small GTFS Test Data Set
This scenario verifies the LDES server can keep in sync with the GTFS updates (GTFS/RT).
```gherkin
Given a GTFS data set with a single route, a couple of stops and a single trip
When that data set is updated after the gtfs2ldes service was started initially
Then that service should POST the updated Linked Connections Event Stream members to the LDES server upon the next run
```
### Test Setup
For this scenario we can use the [GTFS2LDES / Workflow / Server / Mongo](../../../support/context/gtfs2ldes-workflow-server-mongo/README.md) context. Please copy the [environment file (env.ingest)](./env.ingest) to a personal file (e.g. `env.user`) and fill in the mandatory arguments or, if available, append the specific `env.<gtfs-use-case>` file to your personal file.

> **Note**: make sure to verify the settings in your personal `env.user` file to contain the correct file paths, relative to your system or the container where appropriate, etc. Also ensure that the file paths actually exist, if not, create then. E.g.:
>
> for NMBS data set: `mkdir -p ~/data/gtfs/nmbs/lc/; mkdir ~/data/gtfs/nmbs/mongo.db/`
>
> for De Lijn data set: `mkdir -p ~/data/gtfs/delijn/lc/; mkdir ~/data/gtfs/delijn/mongo.db/`

> **Note**: for the [GTFS(RT) data from De Lijn](https://data.delijn.be/) you will need to request a subcription and then you will receive an API (authentication) key which is required to receive the realtime changes.

> **Note**: when using the GTFS data from NMBS you will encounter issues with the generated linked connections because the [URI templates from the gtfs2ldes-js system](https://github.com/julianrojas87/gtfs2ldes-js/blob/main/config.json) are currently fixed when creating the docker image.

> **Note**: you can set the `COMPOSE_FILE` environment property to the [docker compose file](../../../support/context/gtfs2ldes-workflow-server-mongo/docker-compose.yml) so you do not need to provide it in each docker compose command. E.g.:
```bash
export COMPOSE_FILE="../../../support/context/gtfs2ldes-workflow-server-mongo/docker-compose.yml"
```

Then you can create the images and run all systems (except the gtfs2ldes-js system which should be started at a later time) by executing the following command:
```bash
docker compose --env-file env.user create
docker compose --env-file env.user start nifi-workflow ldes-mongodb ldes-server
```

### Test Execution
To run the test, you need to:
1. Upload a pre-defined NiFi workflow containing a ListenHTTP (to listen for POSTed GTFS data) and a InvokeHTTP processor (to send the LDES members to the LDES server) and start it.
2. Start the GTFS to LDES convertor and wait for it to start sending GTFS data (connections).
3. Verify that LDES members are being received by the LDES-server.
4. Verify that the NiFi workflow queue (between the ListenHTTP and InvokeHTTP processors) does not start to fill up.

#### 1. Upload NiFi Workflow
Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file.

Once logged in, create a new process group based on the [ingest workflow](./nifi-workflow.json) as specified in [here](../../../support/workflow/README.md#creating-a-workflow).

Start the workflow as described [here](../../../support/workflow/README.md#starting-a-workflow).

Verify that the ListHTTP processor is listening for incoming GTFS/RT members:
```bash
curl http://localhost:9005/gtfs/healthcheck
```

#### 2. Start the GTFS to LDES convertor
Restart the GTFS to LDES convertor as described [here](../../../support/context/gtfs2ldes-workflow-server-mongo/README.md#start-the-gtfs-to-ldes-convertor) and watch its Docker logs to know when it starts sending GTFS connections to the workflow.

To restart the GTFS to LDES convertor:
```bash
docker compose --env-file env.user start gtfs2ldes-js
```

Verify that the GTFS to LDEs convertor is processing the GTFS or GTFS/RT source:
```bash
docker logs --follow gtfs2ldes-workflow-server-mongo_gtfs2ldes-js
```

#### 3. Verify LDES Members Received
To ensure GTFS connections are being received by the LDES-server you can use the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `ldesmember` document collection contains the LDES members (check the document count).

> **Note**: that we store the document collection in a database as configured in the Docker environment argument `SPRING_DATA_MONGODB_DATABASE`.

In addition, you can request the members (e.g. as [N-Quads](https://www.w3.org/TR/n-quads/) with `<connection-name>` replaced with the value of the Docker environment variable `LDES_COLLECTIONNAME`):
```bash
curl --location --header 'Accept: application/n-quads' http://localhost:8080/connections
```

### Test Teardown
First stop the workflow as described [here](../../../support/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/gtfs2ldes-workflow-server-mongo/README.md#stop-the-systems), i.e.:
```bash
docker compose --env-file env.user down
```
