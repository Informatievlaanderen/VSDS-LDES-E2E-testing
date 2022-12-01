# LDES Client Can Persist State
This test validates user story **As an LDES Client, I want to follow and resume an LDES and keep it's state** ([VSDSPUB-59](https://vlaamseoverheid.atlassian.net/browse/VSDSPUB-198)) and was shown during demo 15 on December, 7th 2022.

## Scenario: Pause LDES Fragment Fetching and Resume From Last Queued Fragment
This scenario verifies that the LDES client resumes processing at the last queued fragment, not the configured initial fragment.
```gherkin
Given a data set with a fragment containing members A, B and C
And a fragment containing members D, E and F
And a last fragment containing members G and H
When the LDES client retrieves the fragmented LDES
Then the following members are retrieved: A, B, C, D, E, F, G and H
```
> **Note**: we use 4 fragments containing 250 members each and 1 (last) fragment containing 16 members (small subset of the GIPOD).

### Test Setup
For this scenario we use a [workflow](docker-compose.yml) based on the [Simulator / Workflow / Sink / Mongo](../../../support/context/simulator-workflow-sink-mongo/README.md) context (but without the mongo container). Please copy the [environment file (env.client-persistence)](./env.client-persistence) to a personal file (e.g. `env.user`) and fill in the mandatory arguments. 

Then you can run the systems by executing the following command:
```bash
docker compose --env-file env.user up
```

The data set is already seeded (see [simulator](http://localhost:9011/)):
```bash
curl http://localhost:9011/
```
returns:
```json
{
    "aliases":[],
    "fragments":[
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-21T09:38:34.617Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-28T14:50:23.317Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-06T11:55:00.313Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-13T11:36:49.04Z"],
    "responses":{}
}
```

We only need to [alias it](./create-alias.json):
```bash
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```

### Test Execution
To run the test, you need to:
1. Upload a pre-defined NiFi workflow containing the LDES client processor and a InvokeHTTP processor (to send the LDES members to the sink).
2. Start the NiFi workflow and wait for it to process all LDES members.
3. Verify that all LDES members from the GIPOD simulator are received by the sink HTTP server.

#### 1. Upload NiFi Workflow
Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file.

Once logged in, create a new process group based on the [replicate workflow](./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the sink HTTP server.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances`
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-client-sink/member` and the property `HTTP method` should be `POST`

#### 2. Start the Workflow
Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).

#### 3. Verify LDES Members Received
The GIPOD simulator (http://localhost:9011) is seeded by a subset of the GIPOD dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served.

You can verify that, after some time, all (1016) LDES members are received by the sink HTTP server by visit the following pages: http://localhost:9003 (count) and http://localhost:9003/member (LDES member ids).

### Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/simulator-workflow-sink-mongo/README.md#stop-the-systems), i.e.:
```bash
docker compose --env-file env.user down
```
