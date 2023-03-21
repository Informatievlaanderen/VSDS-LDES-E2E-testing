# Upgrading a LDES Server in an LDI-orchestrator Scenario
This test verifies the upgrade procedure for a LDES Server in a typical scenario where we use an LDI-orchestrator. We do not want to interrupt the inflow of data as some systems (such as Orion) cannot buffer the messages and consequently we would loose some during the upgrade process.

This test uses a docker environment containing a data generator simulating the system pushing data, an LDI, an LDES data store (mongoDB), an old LDES server and a new LDES server (both setup for timebased fragmentation).

## Test Setup
1. Launch all systems except for the new LDES server: 
    ```bash 
    docker compose up -d 
    ```

2. Start the data generator pushing JSON-LD messages (based on a single message [template](./data/device.template.json)) to the http listener:
    ```bash
    docker compose up json-data-generator -d
    ```

3. Verify that members are available in LDES:
    ```bash
    curl http://localhost:8080/devices-by-time
    ```
    and data store member count increases (execute repeatedly):
    ```bash
    curl http://localhost:9019/iow_devices/ldesmember
    ```

## Test Execution
1. Pause the LDI workflow output:
    ```
    curl -X POST "http://localhost:8081/admin/api/v1/pipeline/halt" -H "Content-Type: application/ld+json"
    ```

2. Verify old server is done processing i.e. data store member count does not change (execute repeatedly):
    ```bash
    curl http://localhost:9019/iow_devices/ldesmember
    ```

3. Bring old server down (stop it, remove volumes and image without confirmation):
    ```bash 
    docker compose stop old-ldes-server 
    docker compose rm --force --volumes old-ldes-server
    ```

4. Launch new server, wait until database migrated and server started (i.e. check logs):
    ```bash
    docker compose up new-ldes-server -d
    docker logs --tail 1000 -f $(docker ps -q --filter "name=new-ldes-server$")
    ```

    > **Note**: the  database has been fully migrated when the log file contains `Mongock has finished` at or near the end (press `CTRL-C` to end following the log file).

5. Verify that members are available in LDES and find last fragment (i.e. mutable)
    ```bash
    docker compose up ldes-list-fragments -d
    sleep 3 # ensure stream has been followed up to the last fragment
    export LAST_FRAGMENT=$(docker logs --tail 1 $(docker ps -q --filter "name=ldes-list-fragments$"))
    curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
    ```

6. Resume LDI workflow output:
    ```
    curl -X POST "http://localhost:8081/admin/api/v1/pipeline/resume" -H "Content-Type: application/ld+json"
    ```

7. Verify last fragment member count increases
    ```bash
    curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
    ```

8. Verify data store member count increases
    ```bash
    curl http://localhost:9019/iow_devices/ldesmember
    ```

## Test teardown
Stop data generator and new server, and bring all systems down:
```bash
docker compose stop json-data-generator
docker compose stop new-ldes-server
docker compose --profile delay-started down
```
