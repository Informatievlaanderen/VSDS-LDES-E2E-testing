# Upgrading a LDES Server in an LDI-orchestrator Scenario
This test verifies the upgrade procedure for a LDES Server in a typical scenario where we use an LDI-orchestrator. We do not want to interrupt the inflow of data as some systems (such as Orion) cannot buffer the messages and consequently we would loose some during the upgrade process.

This test uses a docker environment containing a data generator simulating the system pushing data, an LDI, an LDES data store (mongoDB), an old LDES server and a new LDES server (both setup for timebased fragmentation).

## Scenario: Upgrade the LDES server
This scenario verifies the LDES server can be upgraded using an ldi-orchestrator.
```gherkin
Given an LDES server
When I pause the LDI-output
And I start a new server that resumes the LDI-output
Then the data store member count increases
```

### Test Setup
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

### Test Execution
To run the test, you need to:
1. Pause LDI-output
2. Ensure old server is done processing and bring old server down
3. Launch new server, wait until database migrated and server started
4. Verify that members are available in LDES and find last fragment
5. Resume LDI-output
6. Verify last fragment member count increases
7. Verify data store member count increases

#### 1. Pause the LDI-output 
```
to pause LDIO: “/admin/api/v1/pipeline/halt”
```

#### 2. Ensure old server is done processing (i.e. data store member count does not change) and bring old server down (stop it, remove volumes and image without confirmation):
```bash 
docker compose stop old-ldes-server 
docker compose rm --force --volumes old-ldes-server
```

#### 3. Launch new server, wait until database migrated and server started (i.e. check logs)
```bash
docker compose up new-ldes-server -d
docker logs --tail 1000 -f $(docker ps -q --filter "name=new-ldes-server$")
```
> **Note**: the  database has been fully migrated when the log file contains `Mongock has finished` at or near the end (press `CTRL-C` to end following the log file).

#### 4. Verify that members are available in LDES and find last fragment (i.e. mutable)
```bash
docker compose up ldes-list-fragments -d
sleep 3 # ensure stream has been followed up to the last fragment
export LAST_FRAGMENT=$(docker logs --tail 1 $(docker ps -q --filter "name=ldes-list-fragments$"))
curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
```

#### 5. Resume LDI-output
```
to continue LDIO: “/admin/api/v1/pipeline/resume”
```

#### 6. Verify last fragment member count increases
```bash
curl -s -H "accept: application/n-quads" $LAST_FRAGMENT | grep "<https://w3id.org/tree#member>" | wc -l
```

#### 7. Verify data store member count increases
```bash
curl http://localhost:9019/iow_devices/ldesmember
```


### Test Teardown
1. Stop data generator and stop new server:
```bash
docker compose stop new-ldes-server
docker compose stop json-data-generator
```

2. Bring all systems down:
```bash
docker compose --profile delay-started down
```
