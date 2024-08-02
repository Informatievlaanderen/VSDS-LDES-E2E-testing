# NiFi Workbench Components Work As Expected

We verify the functionality of all the core components using LDIO workbench instead of with the NiFi workbench. In order to ensure that the NiFi components still work one or two E2E tests are needed which demonstrates the usage of the core components in a NiFi workflow and ensures the NiFi wrappers for these core components are correctly implemented and that these remain functional.

Create an E2E test combining all the NiFi components used for data publishing (NGSI v2 to LD adaptor, sparql construct, create version object, version materialization & RDF4J materialization).

Create an E2E test combining all the NiFi components used for data consumption (LDES client).

Optionally, combine both tests in one E2E test.

**Goal**: Can create NiFi workflows with all LDES related components to demonstrate its usage, both for data publishing and data consumption

**Context**: docker compose with (use test-015 as basis)

* Message Generator (NGSI-v2 with 1 wqo), 
* NiFi workbench containing: 
    * data publishing workflow = HTTP listener => v2 to LD => sparql construct (OSLO transformation) => version object creation
        * => http out to LDES server observations
        * => Version Materialising => RD4J put
    * data consumption workflows:
        * observations = LDES client for observations => send to message sink
* LDES server holding observations LDES, paginated
* test message sink for capturing observations (version objects)
* RDF4J system for capturing observations (state objects)

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Setup and run all systems by executing the following (bash) command:
```bash
clear
sh ./setup.sh
```

## Test Execution
1. Start the JSON Data Generator to start receiving `WaterQualityObserved` messages:
    ```bash
    docker compose up test-message-generator -d
    ```

2. Verify if observations are being inserted on the sink (the number of members should increase over time):
    ```bash
    curl http://localhost:9003
    ```

3. Request an observation from the message sink and validate the OSLO state model - note the device reference and observation date
    ```bash
    curl http://localhost:9003/member
    ```

4. Verify the observations are being updated with the same sensor in the RDF4J data store

    The query should contain only 3 observation results linked to the 1 sensor we keep sending updates about. Therefor these values should increase in time as they are, in this example, linked to the index of a generated test message.

    ```bash
    RESULTS=$(curl -s http://localhost:7200/repositories/observations -H 'accept: application/x-sparqlstar-results+json' --data-urlencode query@./graphdb/query.rq | jq '.results.bindings')
    echo $RESULTS | jq '.[].observation'
    echo $RESULTS | jq '.[].result'
    ```

    >**NOTE** that the observation values should all be the same. Likewise, the result values should also all be the same.

## Test Teardown

Stop and destroy all systems
```bash
sh ./teardown.sh
```
