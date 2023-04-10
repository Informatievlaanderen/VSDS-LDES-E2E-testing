# Convert NGSI-v2 State Objects to NGSI-LD Version Objects
The test verifies that the NiFi Workbench can convert IoW messages formatted as NGSI-v2 into NGSI-LD messages. It uses a [JSON Data Generator](https://github.com/Informatievlaanderen/VSDS-LDES-E2E-message-generator/README.md) which produces a continues stream of water-quality observations (as a controlled alternative to an actual Orion broker over which we have no control), an Apache NiFi instance containing an HTTP listener that receives the observations (and devices & models), the NiFi components translating the NGSI-v2 entities to NGSI-LD entities, the NiFi components creating the LDES members (version objects) from the NGSI-LD entities and the LDES servers configured to capture the LDES members.

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

1. Run all systems except the workflow by executing the following (bash) command:
    ```bash
    docker compose up -d
    ```
    Please ensure that the LDES Servers are ready to ingest by following the container logs until you see the following message `Mongock has finished`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server-models$")
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server-devices$")
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server-observations$")
    ```
    Press `CTRL-C` to stop following each log.

2. Verify that the empty LDES can be retrieved:
    ```bash
    curl http://localhost:8072/device-models
    curl http://localhost:8071/devices
    curl http://localhost:8073/water-quality-observations
    ```

## Test Execution
1. [Logon to Apache NiFi](../_nifi-workbench/README.md#logon-to-apache-nifi) user interface at http://localhost:8000/nifi and [create a workflow](../_nifi-workbench/README.md#create-a-workflow) from the [provided workflow](./nifi-workflow.json) and [start it](../_nifi-workbench/README.md#start-a-workflow).

    The workflow contains three flows with a standard HTTP listener (ListenHTTP), the NGSI-v2 to NGSI-LD translator, the NiFi processor creating NGSI-LD version objects and a standard InvokeHTTP processor to send the LDES members to the corresponding LDES server.

2. Verify that the NiFi HTTP listeners are ready (they should answer `OK`):
    ```bash
    curl http://localhost:9013/ngsi/device-model/healthcheck
    curl http://localhost:9012/ngsi/device/healthcheck
    curl hhttp://localhost:9014/ngsi/water-quality-observed/healthcheck
    ```

3. Upload the [device](./data/device.json) and [device model](./data/device-model.json) test files to the corresponding HTTP listener:
    ```bash
    curl -X POST http://localhost:9013/ngsi/device-model -H 'Content-Type: application/json' -d '@data/device-model.json' 
    curl -X POST http://localhost:9012/ngsi/device -H 'Content-Type: application/json' -d '@data/device.json'
    ```

4. Start the JSON Data Generator to start receiving `WaterQualityObserved` messages:
    ```bash
    docker compose up test-message-generator -d
    ```

5. Verify all LDES streams 

    The [models LDES server](http://localhost:8072/models/by-time)) and the [devices LDES server](http://localhost:8071/devices/by-time) should contain one member. The [observations LDES server](http://localhost:8073/observations/by-time) continues to grow as `WaterQualityObserved` LDES members are ingested and form an ever growing, time-based fragmented LDES stream:
    ```bash
    curl http://localhost:8072/device-models/by-time
    curl http://localhost:8071/devices/by-time
    curl http://localhost:8073/water-quality-observations/by-time
    ```

    > **Note**: The model type should be `https://uri.etsi.org/ngsi-ld/default-context/DeviceModel`, the device type should be `https://uri.etsi.org/ngsi-ld/default-context/Device` and the observation type should be `https://uri.etsi.org/ngsi-ld/default-context/WaterQualityObserved`.


## Test Teardown
First [stop the workflow](../_nifi-workbench/README.md#stop-a-workflow) and then to stop all systems use:
```bash
docker compose stop test-message-generator
docker compose --profile delay-started down
```

## C4 Diagrams

### Context
![context](./artwork/demo-ldes-server.context.png)

### Container
![container](./artwork/demo-ldes-server.container.png)

### Component
![component](./artwork/demo-ldes-server.component.png)
