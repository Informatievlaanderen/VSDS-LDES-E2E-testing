# Data can be sent to and RDF4J repository
This test validates user story [**Processor onboarding: RDF4J repository put** (VSDSPUB-409)](https://vlaamseoverheid.atlassian.net/browse/VSDSPUB-409) and was shown during demo ?? on March, 28th 2023.

## Scenario: Pause LDES Fragment Fetching and Resume From Last Queued Fragment
This scenario verifies that the LDES client resumes processing at the last queued fragment, not the configured initial fragment.
```gherkin
Given a workflow that processes LDES members
When the RDF4J repository materialisation processor is added to the NiFi workflow and started
Then the members will be sent to the configured RDF4J repository
```
> **Note**: we use imaginary people data in n-quad format, based on the [vCard to RDF mapping](https://www.w3.org/TR/vcard-rdf/)

### Test Setup
For this scenario we use a [workflow](docker-compose.yml) with a NiFi workbench and and RDF4J workbench. Please copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change it as needed.

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
1. Upload a pre-defined [NiFi workflow](nifi-workflow.json) containing a GetFile processor (to load the test data from the file system and transform it into FlowFile instances) and the RDF4JRepositoryMaterialisationProcessor (to send the LDES members to the RDF4J repository).
2. Copy the (initial data files)[./data/add] to the (shared volume)[./nifi]
3. Start the NiFi workflow
4. Verify that the RDF4J repository has the uploaded data.
5. Copy the (updated data file)[./data/update/17_taylor_kennedy_changed.nq] to the (shared volume)[./nifi]
6. Verify that the first name of Taylor Kennedy was changed to 'CHANGED'


#### 1. Upload NiFi Workflow
Browse to the [Apache NiFi user interface](https://localhost:8081/nifi) (it may take a minute or two before it is available) and upload the [NiFi workflow](nifi-workflow.json) process group.

You can verify the GetFile processor properties to ensure the correct shared volume is configured and the rdf4j processor properties to ensure that the correct host and repository is configured.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances`
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-client-sink/member` and the property `HTTP method` should be `POST`

#### 2. Copy the initial data set
You can either manually copy the files from the (data directory)[./data/add] or run the following command:

```shell
make seed
```

#### 3. Start the NiFi workflow
Browse back to the (NiFi workbench instance)[http://localhost:8082/nifi] and start the workflow.

#### 4. Verify the initial data set on the RDF4J repository


#### 5. Copy the updated person data
You can either manually copy the (update file)[./data/update/17_taylor_kennedy_changed.nq] or run the following command:

```shell
make update
```

#### 6. Verify that the update was registered on the RDF4J repository


### Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems by executing:
```bash
make stop
```
this will execute the following command:
```bash
docker compose --env-file user.env down
```
