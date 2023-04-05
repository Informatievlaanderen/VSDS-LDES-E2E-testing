# LDES Client Can Persist State
This test validates user story [**As an LDES Client, I want to follow and resume an LDES and keep it's state** (VSDSPUB-59)](https://vlaamseoverheid.atlassian.net/browse/VSDSPUB-198) and was shown during demo 15 on December, 7th 2022.


## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

1.  Run all systems except the workflow by executing the following (bash) command:
    ```bash
    docker compose up -d
    ```

2. Ingest the [data set](./data/gamma.jsonld) and [alias it](./data/create-alias.json) - in a new terminal window (bash shell):
    ```bash
    for f in ../../data/gipod/*; do curl -X POST "http://localhost:9011/ldes" -H "Content-Type: application/ld+json" -d "@$f"; done
    curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@data/create-alias.json'
    ```
    You can verify that the LDES Server Simulator now contains a single fragment (containing one member - see http://localhost:9011/api/v1/ldes/mobility-hindrances):
    ```bash
    curl http://localhost:9011/
    ```
    returns:
    ```json
    {
    "aliases": [
        "/api/v1/ldes/mobility-hindrances"
    ],
    "fragments": [
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-21T09:38:34.617Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-28T14:50:23.317Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-06T11:55:00.313Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-13T11:36:49.04Z"
    ],
    "responses": {}
    }
    ```






## Scenario: Pause LDES Fragment Fetching and Resume From Last Queued Fragment
This scenario verifies that the LDES client resumes processing at the last queued fragment, not the configured initial fragment.
```gherkin
Given a data set with a fragment containing members A, B, C, D and E
When the LDES client retrieves the fragmented LDES and is then paused and resumed
Then the fragments and members that have already been processed are not requested again.
```
> **Note**: we use 4 fragments containing 250 members each and 1 (last) fragment containing 16 members (small subset of the GIPOD).

### Test Setup
For this scenario we use a [workflow](docker-compose.yml) based on the [Simulator / Workflow / Sink / Mongo](../../../support/context/simulator-workflow-sink-mongo/README.md) context (but without the mongo container as we use an in-memory database). Please copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change it as needed.

This demo makes use of a [Makefile](./Makefile) to simplify the commands that need to be executed.

You can run the systems by executing the following command:

```bash
export ENV_FILE=user.env
make run
```

This will run `docker compose` daemonised.

```bash
docker compose --env-file user.env up -d
```

### Test Execution
To run the test, you need to:
1. Seed the LDES Server Simulator with a part of the GIPOD data set
2. Upload a pre-defined [NiFi workflow](nifi-workflow.json) containing the LDES client processor and a InvokeHTTP processor (to send the LDES members to the sink).
3. Start the NiFi workflow, follow the members in the NiFi queue and stop the workflow when a fragment has been fully processed (250 members).
4. Verify that only the processed fragments were requested from the server-simulator by visiting [http://localhost:9011](http://localhost:9011).
5. Restart the NiFi workflow, follow the logging and stop the workflow when a following fragment has been processed.
6. Verify that the processed fragments were requested from the server-simulator by visiting the server simulator [http://localhost:9011](http://localhost:9011).

#### 3. Start the Workflow and stop when a fragment was processed
Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).
Stop the workflow when the queue shows 250 members or the shell logging shows a message like this:

```shell
PROCESSED (IMMUTABLE) fragment http://ldes-server-simulator/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z has 250 member(s) and 1 tree:relation(s)
```

#### 4. Verify the requested fragments

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

#### 5. Restart the Workflow and stop when another fragment was processed
Restart the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).

When the queue hits 500 members, stop the workflow again.

#### 6. Verify the requested fragments

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
this will execute the following command:
```bash
docker compose --env-file user.env down
```
