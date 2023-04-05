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
echo http://old-nifi-workflow:9012/ngsi/device > ./data/TARGETURL
docker compose up json-data-generator -d
```

3. Verify that members are available in the LDES:
```bash
curl http://localhost:8080/devices-by-time
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
echo http://new-nifi-workflow:9012/ngsi/device > ./data/TARGETURL
```

3. Ensure all data sent to LDES server (i.e. member count does not change) and bring old workbench down:
```bash
docker compose stop old-ldio
docker compose rm --force --volumes old-ldio
```

4. Verify that members are available in LDES and find last fragment (i.e. mutable):
```bash
docker compose up ldes-list-fragments -d
sleep 3 # ensure stream has been followed up to the last fragment
export LAST_FRAGMENT=$(docker logs --tail 1 $(docker ps -q --filter "name=ldes-list-fragments$"))
curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
```

5. Resume new LDI-output

6. Verify last fragment member count increases:
```bash
curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
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
