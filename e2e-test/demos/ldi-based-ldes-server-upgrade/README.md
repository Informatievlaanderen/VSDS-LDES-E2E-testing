# Create E2E test for upgrading a LDES server using the ldi-orchestrator
This test validates user story **As a Data Publisher, I want to handle an upgrade of the LDES server and Linked Data Orchestrator** (VSDSPUB-497).

## Scenario: Upgrade the LDES server
This scenario verifies the LDES server can be upgraded using an ldi-orchestrator.
```gherkin
Given an LDES server
When I pause the LDI-output
And I start a new server that resumes the LDI-output
Then the data store member count increases
```

### Test Setup
For this scenario we can use the TODO context (../../../support/context/simulator-workflow-sink-mongo/README.md) context. If needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

> **Note**: you can set the `COMPOSE_FILE` environment property to the [docker compose file](../../../support/context/simulator-workflow-sink-mongo/docker-compose.yml) so you do not need to provide it in each docker compose command. E.g.:
```bash
export COMPOSE_FILE="../../../support/context/simulator-workflow-sink-mongo/docker-compose.yml"
```

Launch all systems except for the new LDES server:
```bash
docker compose up -d
```

### Test Execution
To run the test, you need to:
1. Pause LDI-output
2. Ensure old server is done processing and bring old server down
3. Launch new server, wait until database migrated and server started
4. Verify that members are available in LDES and find last fragment
5. Resume LDI-output
6. Verify last fragment member count increases
7. Verify data store member count increases

#### 1. Upload NiFi Workflow
Browse to the [Apache NiFi user interface](https://localhost:8443/nifi) and create a new process group based on the TODO ./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the sink HTTP server.
* the `LdesClient` component property `Datasource url` should be TODO
* the `InvokeHTTP` component property `Remote URL` should be TODO and the property `HTTP method` should be `POST`

#### 2. Start the Workflow
Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).

Verify that the TODO [HTTP listener](http://localhost:9012/grar/addresses/healthcheck) is working: it should answer `OK`.

#### 3. Pause the LDI-output 
```
to pause LDIO: “/admin/api/v1/pipeline/halt”
```

#### 4. Ensure old server is done processing and bring old server down
```
data store member count does not change
```

#### 5. Launch new server, wait until database migrated and server started (i.e. check logs)
#### 6. Verify that members are available in LDES and find last fragment (i.e. mutable)
#### 7. Resume LDI-output
```
to continue LDIO: “/admin/api/v1/pipeline/resume”
```

#### 8. Verify last fragment member count increases
#### 9. Verify data store member count increases



### Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/simulator-workflow-sink-mongo/README.md#stop-the-systems), i.e.:
```bash
docker compose stop json-data-generator
docker compose --profile delay-started down
```
