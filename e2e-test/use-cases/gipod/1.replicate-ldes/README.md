# LDES client can replicate an LDES
This test validates user story **As a data intermediary I want to replicate the GIPOD LDES data set** (VSDSPUB-59) and was shown during demo 1 on May, 24th 2022.

## Scenario: a larger data set served using fragments
This scenario verifies the LDES client replicating a GIPOD data set containing a small number of LDES members served as a few fragments.
```gherkin
Given a data set with a fragment containing members A, B and C
And a fragment containing members D, E and F
And a last fragment containing members G and H
When the LDES client retrieves the fragmented LDES
Then the following members are retrieved: A, B, C, D, E, F, G and H
```
> **Note**: we use 4 fragments containing 250 members each and 1 (last) fragment containing 16 members (small subset of the GIPOD).

### Test setup
For this scenario we can use the [simulator / workflow / sink](../../../support/context/simulator-workflow-sink/README.md) context. Please copy the [environment file (env.replicate)](./env.replicate) to a personal file (e.g. `env.user`) and fill in the mandatory arguments. Then you can run the systems by executing the following command:

```bash
docker compose -f ../../../support/context/simulator-workflow-sink/docker-compose.yml --env-file env.user up
```

### Test execution
To run the test, you need to:
1. Upload a pre-defined NiFi workflow containing the LDES client processor and a InvokeHTTP processor (to send the LDES members to the sink).
2. Start the NiFi workflow and wait for it to process all LDES members.
3. Verify that all LDES members from the GIPOD simulator are received by the sink http-server.

#### 1. Upload NiFi workflow
Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file.

Once logged in, create a new process group based on the [replicate workflow](./nifi-workflow.json) as specified in [here](../../../support/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the sink http-server.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z`
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-client-sink/member` and the property `HTTP method` should be `POST`

#### 2. Start the workflow
Start the workflow as described [here](../../../support/workflow/README.md#starting-a-workflow).

#### 3. Verify LDES members received
The GIPOD simulator (http://localhost:9011) is seeded by a subset of the GIPOD dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served.

You can verify that, after some time, all (1016) LDES members are received by the sink http-server by visit the following pages: http://localhost:9003 (count) and http://localhost:9003/member (LDES member IDs).

### Test teardown
First stop the workflow as described [here](../../../support/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/simulator-workflow-sink/README.md#stop-the-systems).