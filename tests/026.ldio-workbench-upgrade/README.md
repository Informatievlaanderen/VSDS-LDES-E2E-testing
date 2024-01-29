# Upgrade the LDES workbench with LDI
This test verifies the upgrade procedure for a LDES Workbench with LDI in a typical scenario where messages are being pushed to the workflow. We do not want to interrupt the inflow of data as some system (such as Orion) cannot buffer the messages and consequently we would lose some during the upgrade process.

This test uses a docker environment a data generator simulating the system pushing data, an old LDI, a new LDI, a LDES server setup for timebased fragmentation and a LDES data store (mongoDB).

## Test setup
1. Launch all systems except for the new LDES workbench and JSON data generator:
    ```bash
    docker compose up -d
    ```
    Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Cancelled mongock lock daemon`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
    ```
    Press `CTRL-C` to stop following the log.

   > **Note**: as of server v1.0 which uses dynamic configuration you need to execute the [seed script](./config/seed.sh) to setup the LDES with its views:
   ```bash
   chmod +x ./config/seed.sh
   sh ./config/seed.sh
   ```

2. Start the data generator pushing JSON-LD messages (based on a single message [template](./data/device.template.json)) to the old http listener:
    ```bash
    echo http://old-ldio-workbench:8080/pipeline > ./data/TARGETURL
    docker compose up test-message-generator -d
    ```

3. Verify that members are available in the LDES:
    ```bash
    curl http://localhost:8080/devices/by-page
    ```
    and that the data store member count increases (execute repeatedly):
    ```bash
    curl http://localhost:9019/iow_devices/ingest_ldesmember
    ```

## Test execution
1. Launch new workbench and pause new LDI-output (via control channel):
    ```bash
    docker compose up new-ldio-workbench -d
    ```
    Please ensure that the new workbench is ready to process the pipeline by following the container log until you see the following message `Started Application in`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=new-ldio-workbench$")
    ```
    Press `CTRL-C` to stop following the log.

2. Stop data generator, change destination path (TARGETURL) to new http-in and restart data generator:
    ```bash
    curl http://localhost:8082/admin/api/v1/pipeline/upgrade-pipeline/halt -X POST
    echo http://new-ldio-workbench:8080/pipeline > ./data/TARGETURL
    ```

3. Ensure all data sent to LDES server i.e. member count does not change (execute repeatedly)):
    ```bash
    curl http://localhost:9019/iow_devices/ingest_ldesmember
    ```
    and bring old workbench down:
    ```bash
    docker compose rm --stop --force --volumes old-ldio-workbench
    ```

4. Verify that members are available in LDES and find last fragment (i.e. mutable):
    ```bash
    curl "http://localhost:8080/devices/by-page?pageNumber=1" -s | grep "isVersionOf" | wc -l
    ```

5. Resume new LDI-output
    ```bash
    curl http://localhost:8082/admin/api/v1/pipeline/upgrade-pipeline/resume -X POST
    ```

6. Verify last fragment member count increases:
    ```bash
    curl "http://localhost:8080/devices/by-page?pageNumber=1" -s | grep "isVersionOf" | wc -l
    ```

7. Verify data store member count increases (execute repeatedly):
    ```bash
    curl http://localhost:9019/iow_devices/ingest_ldesmember
    ```

## Test teardown
Stop data generator and stop new workbench and bring all systems down:
```bash
docker compose rm -s -f -v test-message-generator
rm ./data/TARGETURL
docker compose rm -s -f -v new-ldio-workbench
docker compose down
```
