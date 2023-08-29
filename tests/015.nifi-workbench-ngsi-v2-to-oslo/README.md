# Convert NGSI-v2 State Objects to OSLO Version Objects
This test verifies the convertion towards OSLO models, more specific, it demonstrates converting the [NGSI water quality model](https://github.com/smart-data-models/dataModel.WaterQuality) into its [OSLO model](https://data.vlaanderen.be/standaarden/kandidaat-standaard/vocabularium-en-applicatieprofiel-oslo-waterkwaliteit.html). The test uses a similar setup as the [NGSI-v2 to NGSI-LD conversion test](../014.nifi-workbench-ngsi-v2-to-ngsi-ld/README.md) but adds an additional component in the Apache NiFi workflow to convert the NGSI-LD to the OSLO model. This conversion happens after converting the incoming NGSI-v2 model to the NGSI-LD model and before creating a version object and sending that to an LDES server.

The conversion from NGSI-LD to OSLO is a SPARQL construct conversion and is done using a custom Apache NiFi component ([Sparql Construct](https://www.w3.org/TR/rdf-sparql-query/#construct) processor).

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

1. Run all systems except the workflow by executing the following (bash) command:
    ```bash
    docker compose up -d
    ```
    Please ensure that the LDES Servers are ready to ingest by following the container logs until you see the following message `Cancelled mongock lock daemon`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
    ```
    Press `CTRL-C` to stop following each log.

   > **Note**: as of server v1.0 which uses dynamic configuration you need to execute the [seed script](./config/seed.sh) to setup the LDES with its views:
   ```bash
   chmod +x ./config/seed.sh
   sh ./config/seed.sh
   ```

2. Verify that the empty LDES views can be retrieved:
    ```bash
    curl http://localhost:8080/device-models/by-page
    curl http://localhost:8080/devices/by-page
    curl http://localhost:8080/water-quality-observations/by-page
    ```

## Test Execution
1. [Logon to Apache NiFi](../../_nifi-workbench/README.md#logon-to-apache-nifi) user interface at http://localhost:8000/nifi and [create a workflow](../../_nifi-workbench/README.md#create-a-workflow) from the [provided workflow](./nifi-workflow.json) and [start it](../../_nifi-workbench/README.md#start-a-workflow).

    The workflow contains three flows with a standard HTTP listener (one common ListenHTTP), the NGSI-v2 to NGSI-LD translator, the NiFi processor creating NGSI-LD version objects and a standard InvokeHTTP processor to send the LDES members to the corresponding LDES server.

2. Verify that the NiFi HTTP listener is ready (it should answer `OK`):
    ```bash
    curl http://localhost:8081/healthcheck
    ```

3. Send test data by using the following commands:
    ```bash
    curl -X POST http://localhost:8081/device-models-pipeline -H 'Content-Type: application/json' -d '@data/device-model.json' 
    curl -X POST http://localhost:8081/devices-pipeline -H 'Content-Type: application/json' -d '@data/device.json' 
    ```
   To send a few water quality observations, briefly start the observations generator (type `CTRL-C` to stop it):
    ```bash
    docker compose up test-message-generator -d
    ```

4. Verify all LDES streams

    To validate that the LDES'es contain the correct OSLO models, you can retrieve the LDES views and follow the relations.
     ```bash
     curl http://localhost:8080/device-models/by-page
     curl http://localhost:8080/devices/by-page
     curl http://localhost:8080/water-quality-observations/by-page
     ```

     > **Note**: that only the observations are converted to an OSLO model. The object type should be `ttp://www.w3.org/ns/sosa/ObservationCollection`. The model type and the device type should still be `https://uri.etsi.org/ngsi-ld/default-context/DeviceModel` respectively `https://uri.etsi.org/ngsi-ld/default-context/Device`.

## Test Teardown
First [stop the workflow](../../_nifi-workbench/README.md#stop-a-workflow) and then to stop all systems use:
```bash
docker compose rm -s -f -v test-message-generator
docker compose down
```

## C4 Diagrams

### Context
![context](./artwork/iow-as-is.context.png)

### Container
![container](./artwork/iow-as-is.container.png)

### Component
![component](./artwork/iow-as-is.component.png)
