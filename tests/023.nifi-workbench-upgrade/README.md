# Upgrading a LDES NiFi Workbench
This test verifies the upgrade procedure for a LDES NiFi Workbench in a typical scenario where messages are being pushed to the workflow. We do not want to interrupt the inflow of data as some system (such as Orion) cannot buffer the messages and consequently we would loose some during the upgrade process.

This test uses a docker environment a data generator simulating the system pushing data, an old NiFi workbench, a new NiFi workbench, a LDES server setup for timebased fragmentation and a LDES data store (mongoDB).

## Test setup
1. Launch all systems except for the new NiFi workbench and JSON data generator:
    ```bash
    docker compose up -d
    ```
    Please ensure that the LDES Server is ready to ingest by following the container logs until you see the following message `Cancelled mongock lock daemon`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
    ```
    Press `CTRL-C` to stop following the log.

   > **Note**: as of server v1.0 which uses dynamic configuration you need to execute the [seed script](./config/seed.sh) to setup the LDES with its views:
   ```bash
   chmod +x ./config/seed.sh
   sh ./config/seed.sh
   ```

    Please ensure that the Nifi Workbench is available by repeatedly execution this command until the response is HTTP 200:
    ```bash
    curl --insecure -I https://localhost:8443/nifi/
    ```

2. Connect to the [old NiFi workbench](https://localhost:8443/nifi), log on using the default or your own credentials, upload and start the [old workflow](./old-nifi-workflow.json) (containing older versions of a http listener, a version creation component and a http sender).

3. Start the data generator pushing JSON-LD messages (based on a single message [template](./data/device.template.json)) to the old http listener:
    ```bash
    echo http://old-nifi-workbench:9012/ngsi/device > ./data/TARGETURL
    docker compose up test-message-generator -d
    ```

4. Verify that members are available in the LDES:
    ```bash
    curl http://localhost:8080/devices/by-page
    ```
    and that the data store member count increases (execute repeatedly):
    ```bash
    curl http://localhost:9019/iow_devices/ingest_ldesmember
    ```

## Test execution
1. Launch the [new NiFi workbench](http://localhost:8000/nifi), connect to it in an incognito tab or a different browser (due to the different security) upload & start the [new workflow](./new-nifi-workflow.json) (containing a newer version of a http listener, a version creation processor and a http sender), and stop the new http sender.
    ```bash
    docker compose up new-nifi-workbench -d
    ```

2. Change the destination path (TARGETURL) to the new http listener:
    ```bash
    echo http://new-nifi-workbench:9012/ngsi/device > ./data/TARGETURL
    ```

3. Ensure all the data is sent to the LDES server, i.e. the old workflow queues are empty. Then, stop the old workflow and bring the old workbench down:
    ```bash
    docker compose rm --stop --force --volumes old-nifi-workbench
    ```

4. Verify that members are available in LDES and check member count in the last fragment:
    ```bash
    docker compose up ldes-list-fragments -d
    sleep 3 # ensure stream has been followed up to the last fragment
    export LAST_FRAGMENT=$(docker logs --tail 1 $(docker ps -q --filter "name=ldes-list-fragments$"))
    curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
    ```

5. Start http sender in the new workflow.

6. Verify last fragment member count increases:
    ```bash
    curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
    ```

7. Verify data store member count increases (execute repeatedly):
    ```bash
    curl http://localhost:9019/iow_devices/ingest_ldesmember
    ```

## Test teardown
Stop data generator and new workbench, and bring all systems down:
```bash
docker compose rm -s -f -v test-message-generator
docker compose rm -s -f -v new-nifi-workbench
docker compose down
```
