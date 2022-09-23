# Modify NGSI-LD to Contain Version Objects
This test validates user story **Publish IoW data using time-based fragmentation** (VSDSPUB-260) and more specific its task **Create NGSI-LD to LDES members (version objects)** (VSDSPUB-263).

IoW data contains objects of type `WaterQualityObserved`, `Device` and `DeviceModel`. The updates received (mostly `WaterQualityObserved`) represent the actual state of the objects and each subsequent update overwrites this state. In order to conform the LDES specification, an LDES contains immutable (version) objects. This test verifies the correct working of the NiFi processor that creates these version objects.

## Test Setup
For this test we can use the [Workflow](../../../support/context/workflow/README.md) context. Please copy the [environment file (env.create-versions)](./env.create-versions) to a personal file (e.g. `env.user`) and fill in the mandatory arguments.

You can change the location of generated files containing the modified NGSI-LD output.

> **Note**: make sure to verify the settings in your personal `env.user` file to contain the correct file paths, relative to your system or the container where appropriate, etc. Also ensure that the file paths actually exist, if not, create then.

> **Note**: you can set the `COMPOSE_FILE` environment property to the [docker compose file](../../../support/context/workflow/docker-compose.yml) so you do not need to provide it in each docker compose command. E.g.:
```bash
export COMPOSE_FILE="../../../support/context/workflow/docker-compose.yml"
```

> **Note**: because of the way Docker and Docker Compose work, it is best to pass the volume mapped location by creating an environment variable, e.g.:
```bash
export NIFI_DATA_FOLDER=$(pwd)/data/output
```

Then you can run the systems by executing the following command:
```bash
docker compose --env-file env.user up
```

## Test Execution
To run the test, you need to:
1. Upload a pre-defined NiFi workflow
2. Start the NiFi workflow
3. Upload a NGSI-LD file

### 1. Upload NiFi Workflow
Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file.

Once logged in, create a new process group based on the [translate workflow](./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

The workflow contains a standard HTTP listener (ListenHTTP), the NiFi processor creating NGSI-LD version objects and a standard processor to capture the modified NGSI-LD content (PutFile).

You can verify the processor settings to ensure the HTTP listener listens on the correct port and path (e.g. http://localhost:9010/ngsi), etc.

### 2. Start the Workflow
Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).

Verify that the HTTP listener is working: http://localhost:9010/ngsi/healthcheck should say `OK`.

### 3. Upload a NGSI-LD File
Upload the given (or your own) NGSI-LD test file to the ListenHTTP processor:

```bash
curl -X POST http://localhost:9010/ngsi -H 'Content-Type: application/json' -d '@data/input/WaterQualityObserved.json' 
```

## Test Verification
Now, you can verify that the modified NGSI-LD by the NiFi processor contains version objects that refer to the original NGSI-LD base object.
