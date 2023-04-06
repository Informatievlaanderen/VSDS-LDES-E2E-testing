# Upgrade the LDES workbench with LDI
This test verifies the upgrade procedure for a LDES Workbench with LDI in a typical scenario where messages are being pushed to the workflow. We do not want to interrupt the inflow of data as some system (such as Orion) cannot buffer the messages and consequently we would lose some during the upgrade process.

This test uses a docker environment a data generator simulating the system pushing data, an old LDI, a new LDI, a LDES server setup for timebased fragmentation and a LDES data store (mongoDB).

## Test setup
1. Launch all systems except for the new LDES workbench and JSON data generator:
```bash
docker compose up -d
```

2. Start the data generator pushing JSON-LD messages (based on a single message [template](./data/device.template.json)) to the old http listener:
```bash
echo http://old-ldio:8080/pipeline > ./data/TARGETURL
docker compose up json-data-generator -d
```

3. Verify that members are available in the LDES:
```bash
curl http://localhost:8080/devices/by-page
```
and that the data store member count increases (execute repeatedly):
```bash
curl http://localhost:9019/iow_devices/ldesmember
```

## Test execution
1. Launch new workbench and pause new LDI-output (via control channel):
```bash
docker compose up new-ldio -d
```

2. Stop data generator, change destination path (TARGETURL) to new http-in and restart data generator:
```bash
curl http://localhost:8082/admin/api/v1/pipeline/halt -X POST
echo http://new-ldio:8080/pipeline > ./data/TARGETURL
```

3. Ensure all data sent to LDES server (i.e. member count does not change) and bring old workbench down:
```bash
curl http://localhost:9019/iow_devices/ldesmember
docker compose stop old-ldio
docker compose rm -v -f old-ldio
```

4. Verify that members are available in LDES and find last fragment (i.e. mutable):
```bash
curl "http://localhost:8080/devices/by-page?pageNumber=1" -s | grep "isVersionOf" | wc -l
```

5. Resume new LDI-output
```bash
curl http://localhost:8082/admin/api/v1/pipeline/resume -X POST
```

6. Verify last fragment member count increases:
```bash
curl "http://localhost:8080/devices/by-page?pageNumber=1" -s | grep "isVersionOf" | wc -l
```

7. Verify data store member count increases (execute repeatedly):
```bash
curl http://localhost:9019/iow_devices/ldesmember
```

## Test teardown
1. Stop data generator and stop new workbench:
```bash
docker compose stop new-ldio
docker compose stop json-data-generator
```

2. Bring all systems down:
```bash
docker compose --profile delay-started down
```
