# LDES client can synchronize an LDES
This test validates user story **As a data intermediary I want to keep in sync with changes in the GIPOD LDES data set.** (VSDSPUB-60) and was shown during demo 1 on June, 7th 2022.

## Scenario: data set has no changes
This scenario verifies the LDES client re-requesting a fragment when there are no changes.
```gherkin
Given a data set with time-based fragments
And all LDES members are retrieved
And the data set contains no new LDES members
When the LDES client re-requests the last fragment
Then no LDES members are forwarded
And no other fragment is re-requested
```

## Scenario: data set has changes
This scenario verifies the LDES client re-requesting a fragment when there are new changes.
```gherkin
Given a data set with time-based fragments
And all LDES members are retrieved
And the data set contains new LDES members
When the LDES client re-requests the last fragment
Then only the new LDES members are forwarded
```

### Test setup
For this scenario we can use the [simulator / workflow / sink](../../../support/context/simulator-workflow-sink/README.md) context. Please copy the [environment file (env.synchronize)](./env.synchronize) to a personal file (e.g. `env.user`) and fill in the mandatory arguments. Then you can run the systems by executing the following command:
```bash
docker compose -f ../../../support/context/simulator-workflow-sink/docker-compose.yml --env-file env.user up
```

### Test execution
To run the test, you need to:
1. Upload a pre-defined NiFi workflow containing the LDES client processor and a InvokeHTTP processor (to send the LDES members to the sink).
2. Seed the initial data set.
3. Start the NiFi workflow and wait for it to process all LDES members.
4. Verify that initial data set is received by the sink http-server and last fragment is re-requested (but no members are sent to the sink http-server).
5. Seed a data set update.
6. Verify that the update is received by the sink http-server.
7. Seed another data set update and again verify that synchronization happens correctly.

#### 1. Upload NiFi workflow
Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file.

Once logged in, create a new process group based on the [replicate workflow](./nifi-workflow.json) as specified in [here](../../../support/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the sink http-server.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-20T09:58:15.867Z`
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-client-sink/member` and the property `HTTP method` should be `POST`

#### 2. Seed the initial data set
For the demo we use a data set containing three fragments in the initial set (for the replication part):
* `alfa.jsonld` (250 items)
* `beta.jsonld` (250 items)
* `gamma.jsonld` (1 item)

We need to upload all but the last fragment as an immutable fragment and the last fragment with a freshness indication of N seconds (see [max-age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#response_directives)). This will ensure that the LDEs client retrieves the first two fragments only once and the last one repeatedly, every N seconds.

To do so, please use an HTTP client that can POST to a URL, such as [Postman](https://www.postman.com/) (graphical tool) or [curl](https://curl.se/) (command line tool, just celebrated its [23th birthday](https://daniel.haxx.se/blog/2021/03/20/curl-is-23-years-old-today/)!). The command line instructions are:
```bash
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/json-ld' -d '@data/alfa.jsonld'
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/json-ld' -d '@data/beta.jsonld'
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/json-ld' -d '@data/gamma.jsonld'
```

**Note** the `?max-age=10` part in the last command limiting the freshness to 10 seconds.

The simulator (http://localhost:9011) will respond with:
```json
{"content-type":"application/json-ld","cache-control":"public, max-age=604800, immutable","id":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-20T09:58:15.867Z"}
{"content-type":"application/json-ld","cache-control":"public, max-age=604800, immutable","id":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-25T10:22:45.82Z"}
{"content-type":"application/json-ld","cache-control":"public, max-age=10","id":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-06-03T07:58:29.2Z"}
```

**Note** the `"cache-control":"public, max-age=604800, immutable"` for the first two fragments and the `"cache-control":"public, max-age=10"` for the last one.

#### 3. Start the workflow
Start the workflow as described [here](../../../support/workflow/README.md#starting-a-workflow).

#### 4. Verify initial data set received
You can verify that, after some time, all (501) LDES members are received by the sink http-server by visit the following pages: http://localhost:9003 (count) and http://localhost:9003/member (LDES member IDs).

To verify all members are received (execute repeatedly):
```bash
curl http://localhost:9003/
```
**Note** that after a short while the result should be (alfa + beta + gamma):
```json
{"count":501}
```

You can also verify by looking in the docker logs files for the LDES server simulator that the LDES client re-requests the last fragment on a regular interval (definied by the amount of seconds in the `?max-age=10` part when uploading it, i.e. every 10 seconds). As there are no changes, the LDES member count of the sink http-server stays the same.

### 5. Seed a data set update
This part verifies that the *synchronization* works after the initial data set is *replicated*.

We use two file that allow us to update the last fragment (synchronization):
* `delta.jsonld` (50 items - adds 49 new members to `gamma.jsonld`)
* `epsilon.jsonld` (117 items - adds 67 new members to `delta.jsonld`)

If you upload an update for the last fragment, you will notice that the sink will receive the additional LDES members from the updated fragment.

To upload the updated last fragment:
```bash
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/json-ld' -d '@data/delta.jsonld'
```

### 6. Verify update received
To verify all LDES members are received, execute the following command (repeatedly):
```bash
curl http://localhost:9003/
```
**Note** that after a short while the result should be (alfa + beta + delta):
```json
{"count":550}
```

### 7. Seed another data set update and re-verify synchronization
You can upload the second update for the last fragment and again validate the new members are received in the sink.

To upload the last update for the last fragment:
```bash
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/json-ld' -d '@data/epsilon.jsonld'
```
**Note** that after a short while the result should be (alfa + beta + epsilon):
```json
{"count":617}
```

### Test teardown
First stop the workflow as described [here](../../../support/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/simulator-workflow-sink/README.md#stop-the-systems), i.e.:
```bash
docker compose -f ../../../support/context/simulator-workflow-sink/docker-compose.yml --env-file env.user down
```
