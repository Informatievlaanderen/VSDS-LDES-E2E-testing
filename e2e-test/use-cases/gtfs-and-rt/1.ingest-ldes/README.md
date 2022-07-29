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
For this scenario we can use the [GTFS2LDES / Workflow / Server / Mongo](../../../support/context/gtfs2ldes-workflow-server-mongo/README.md) context. Please copy the [environment file (env.ingest)](./env.ingest) to a personal file (e.g. `env.user`) and fill in the mandatory arguments. Then you can run the systems by executing the following command:
```bash
docker compose -f ../../../support/context/gtfs2ldes-workflow-server-mongo/docker-compose.yml --env-file env.user up
```

Stop the GTFS to LDES convertor to prevent it to start sending LD objects (it needs a minute or two preparation time) before the workflow is uploaded and started, see [here](../../../support/context/gtfs2ldes-workflow-server-mongo/README.md#stop-the-gtfs-to-ldes-convertor) for details or simply execute:
```bash
docker stop gtfs2ldes-js
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
docker start gtfs2ldes-js
```

#### 3. Verify LDES Members Received
To ensure GTFS connections are being received by the LDES-server you can use the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `ldesmember` document collection contains the LDES members (check the document count).

> **Note**: that we store the document collection in a database as configured in the Docker environment argument `SPRING_DATA_MONGODB_DATABASE`.

In addition, you can request the members (e.g. as [N-Quads](https://www.w3.org/TR/n-quads/) with `<connection-name>` replaced with the value of the Docker environment variable `LDES_COLLECTIONNAME`):
```bash
curl --location --header 'Accept: application/n-quads' http://localhost:8080/<collection-name>
```

### Test Teardown
First stop the workflow as described [here](../../../support/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/gtfs2ldes-workflow-server-mongo/README.md#stop-the-systems), i.e.:
```bash
docker compose -f ../../../support/context/gtfs2ldes-workflow-server-mongo/docker-compose.yml --env-file env.user down
```
