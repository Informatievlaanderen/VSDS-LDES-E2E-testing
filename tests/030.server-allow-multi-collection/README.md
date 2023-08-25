# Host different collections on the same LDES Server
The test verifies that the LDES Server can host multiple LDES.
This test is based on the [IoW test 017](../017.ldio-workbench-ngsi-v2-to-oslo/README.md) where multiple servers are required.
In this test we recreate the same scenario but host all three LDES collections on one LDES server.

> **Note**: that the steps and the results are identical to these from the [IoW test 017](../017.ldio-workbench-ngsi-v2-to-oslo/README.md).

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

1. Run all systems except the workflow by executing the following (bash) command:
    ```bash
    docker compose up -d
    ```
    Please ensure that the LDES Servers are ready to ingest by following the container logs until you see the following message `Cancelled mongock lock daemon`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server")
    ```
    Press `CTRL-C` to stop following each log.

    > **Note**: as of server v1.0 which uses dynamic configuration you need to execute the [seed script](./config/seed.sh) to setup the LDES with its views:
    ```
    chmod +x ./config/seed.sh
    sh ./config/seed.sh
    ```

2. Start the workbench:
    ```bash
    docker compose up ldio-workbench -d
    while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```
    or:
    ```bash
    docker compose up nifi-workbench -d
    while ! curl -s -I "http://localhost:8000/nifi/"; do sleep 5; done
    ```
    > **Note**: for the [NiFi workbench](http://localhost:8000/nifi/) you also need to upload the [workflow](./nifi-workflow.json) and start it. Finally, verify that the NiFi HTTP listeners are ready (they should answer `OK`):
    > ```bash
    > curl http://localhost:8081/healthcheck
    > ```

3. Verify that the empty LDES can be retrieved:
    ```bash
    curl http://localhost:8080/device-models/by-page
    curl http://localhost:8080/devices/by-page
    curl http://localhost:8080/water-quality-observations/by-page
    ```

## Test Execution
1. Send test data by using the following commands:
    ```bash
    curl -X POST http://localhost:8081/device-models -H 'Content-Type: application/json' -d '@data/model.json' 
    curl -X POST http://localhost:8081/devices -H 'Content-Type: application/json' -d '@data/device.json' 
    ```
   To send a few water quality observations, briefly start the observations generator (type `CTRL-C` to stop it):
    ```bash
    docker compose up test-message-generator -d
    ```

2. Verify all LDES streams

    To validate that the LDES'es contain the correct OSLO models, you can retrieve the LDES views and follow the relations.
     ```bash
     curl http://localhost:8080/device-models/by-page
     curl http://localhost:8080/devices/by-page
     curl http://localhost:8080/water-quality-observations/by-page
     ```

     > **Note**: that only the observations are converted to an OSLO model. The object type should be `http://www.w3.org/ns/sosa/ObservationCollection`. The model type and the device type should still be `https://uri.etsi.org/ngsi-ld/default-context/DeviceModel` respectively `https://uri.etsi.org/ngsi-ld/default-context/Device`.

## Test Teardown
If using NiFi, first [stop the workflow](../../_nifi-workbench/README.md#stop-a-workflow) and then to stop all systems use:
```bash
docker compose rm -s -f -v test-message-generator
docker compose rm -s -f -v ldio-workbench
docker compose down
```
or
```bash
docker compose rm -s -f -v test-message-generator
docker compose rm -s -f -v nifi-workbench
docker compose down
```
