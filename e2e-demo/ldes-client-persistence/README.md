# LDES Client Can Persist State
This test validates user story [**As an LDES Client, I want to follow and resume an LDES and keep it's state** (VSDSPUB-59)](https://vlaamseoverheid.atlassian.net/browse/VSDSPUB-198) and was shown during demo 15 on December, 7th 2022.

## Scenario: Pause LDES Fragment Fetching and Resume From Last Queued Fragment
This scenario verifies that the LDES client resumes processing at the last queued fragment, not the configured initial fragment.
```gherkin
Given a data set with a fragment containing members A, B, C, D and E
When the LDES client retrieves the fragmented LDES and is then paused and resumed
Then the fragments and members that have already been processed are not requested again.
```
> **Note**: we use 4 fragments containing 250 members each and 1 (last) fragment containing 16 members (small subset of the GIPOD).

### Test Setup
For this scenario we use a [workflow](docker-compose.yml) based on the [Simulator / Workflow / Sink / Mongo](../../../support/context/simulator-workflow-sink-mongo/README.md) context (but without the mongo container). Please copy the [environment file (env.client-persistence)](./env.client-persistence) to a personal file (e.g. `env.user`) and fill in the mandatory arguments.

This demo makes use of a [Makefile](Makefile) to simplify the commands that need to be executed.

You can run the systems by executing the following command:

```bash
make run
```

This will run `docker compose` and alias the dataset.

```bash
docker compose --env-file env.user up
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```

To verify that the data is already seeded, run this command:
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

### Test Execution
To run the test, you need to:
1. Upload a pre-defined [NiFi workflow](nifi-workflow.json) containing the LDES client processor and a InvokeHTTP processor (to send the LDES members to the sink).
2. Start the NiFi workflow, follow the members in the NiFi queue and stop the workflow when a fragment has been fully processed (250 members).
3. Verify that only the processed fragments were requested from the server-simulator by visiting [http://localhost:9011](http://localhost:9011).
4. Restart the NiFi workflow, follow the logging and stop the workflow when a following fragment has been processed.
5. Verify that the processed fragments were requested from the server-simulator by visiting the server simulator [http://localhost:9011](http://localhost:9011).


#### 1. Upload NiFi Workflow
Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file.

Once logged in, create a new process group based on the [replicate workflow](./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the LDES server simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the sink HTTP server.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances`
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-client-sink/member` and the property `HTTP method` should be `POST`

#### 2. Start the Workflow and stop when a fragment was processed
Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).
Stop the workflow when the queue shows 250 members or the shell logging shows a message like this:

```shell
PROCESSED (IMMUTABLE) fragment http://ldes-server-simulator/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z has 250 member(s) and 1 tree:relation(s)
```

#### 3. Verify the requested fragments

You can verify that the processed fragment was requested once by visit the following pages: [http://localhost:9011](http://localhost:9011).
The response should show something similar to this:

```json
...
"responses": {
"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z": {
"count": 1,
"at": [
"2022-12-05T08:24:39.170Z"
]
},
...
```

#### 4. Restart the Workflow and stop when a fragment was processed
Restart the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).

When the queue hits 500 members, stop the workflow again.

#### 5. Verify the requested fragments

You can verify that the processed fragment was requested once by visit the following pages: [http://localhost:9011](http://localhost:9011).
No matter where in the LDES you halted the NiFi processor, none of the requested fragments should have a count higher than 1.

```json
...
"responses": {
"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z": {
"count": 1,
"at": [
"2022-12-05T08:24:39.170Z"
]
},
...
```


### Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems by executing:

```bash
make stop
```
