# LDES Client Can Replicate an LDES
This test validates user story **As a data intermediary I want to replicate the GIPOD LDES data set** (VSDSPUB-59) and was shown during demo 1 on May, 24th 2022.

## Scenario: a Larger Data Set Served Using Fragments
This scenario verifies the LDES client replicating a GIPOD data set containing a small number of LDES members served as a few fragments.
```gherkin
Given a data set with a fragment containing members A, B and C
And a fragment containing members D, E and F
And a last fragment containing members G and H
When the LDES client retrieves the fragmented LDES
Then the following members are retrieved: A, B, C, D, E, F, G and H
```
> **Note**: we use 4 fragments containing 250 members each and 1 (last) fragment containing 16 members (small subset of the GIPOD).

### Test Setup
For this scenario we can use the [Simulator / Workflow / Sink / Mongo](../../../support/context/simulator-workflow-sink-mongo/README.md) context. If needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

> **Note**: you can set the `COMPOSE_FILE` environment property to the [docker compose file](../../../support/context/simulator-workflow-sink-mongo/docker-compose.yml) so you do not need to provide it in each docker compose command. E.g.:
```bash
export COMPOSE_FILE="../../../support/context/simulator-workflow-sink-mongo/docker-compose.yml"
```

Then you can run the systems by executing the following command:
```bash
docker compose up -d
```

### Test Execution
To run the test, you need to:
1. Seed the LDES Server Simulator with a part of the GIPOD data set
2. Upload a pre-defined NiFi workflow containing the LDES client processor and a InvokeHTTP processor (to send the LDES members to the sink).
3. Start the NiFi workflow and wait for it to process all LDES members.
4. Verify that all LDES members from the GIPOD simulator are received by the sink HTTP server.

#### 1. Upload the Data Set
Run the following (bash) command to seed the LDES Server Simulator with a part of the GIPOD data set and [alias it](./create-alias.json):
```bash
for f in ../../../data/gipod/*; do curl -X POST "http://localhost:9011/ldes" -H "Content-Type: application/ld+json" -d "@$f"; done
curl -X POST "http://localhost:9011/alias" -H "Content-Type: application/json" -d '@create-alias.json'
```

To verify that the data is correctly seeded, run this command (see [simulator](http://localhost:9011/)):
```bash
curl http://localhost:9011/
```
returns:
```json
{
    "aliases":["/api/v1/ldes/mobility-hindrances"],
    "fragments":[
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-21T09:38:34.617Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-28T14:50:23.317Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-06T11:55:00.313Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-13T11:36:49.04Z"
        ],
    "responses":{}
}
```

#### 2. Upload NiFi Workflow
Browse to the [Apache NiFi user interface](https://localhost:8443/nifi) and create a new process group based on the [replicate workflow](./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the sink HTTP server.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances`
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-client-sink/member` and the property `HTTP method` should be `POST`

#### 3. Start the Workflow
Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).

#### 4. Verify LDES Members Received
The GIPOD simulator (http://localhost:9011) is seeded by a subset of the GIPOD dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served.

You can verify that, after some time, all (1016) LDES members are received by the sink HTTP server by visit the following pages: http://localhost:9003 (count) and http://localhost:9003/member (LDES member ids).

Please run the following command repeatedly until it returns the correct member count:
```bash
curl http://localhost:9003/
```

### Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/simulator-workflow-sink-mongo/README.md#stop-the-systems), i.e.:
```bash
docker compose down
```
