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
1. Run all systems except the message generator and NiFi workbench by executing the following (bash) command:
    ```bash
    rm -f ./graphdb/init.lock

    export LOCALHOST=$(hostname)
    docker compose up -d
    while ! curl --fail -I -s --header 'Accept: text/plain' http://localhost:7200/repositories/observations/size ; do sleep 1; done
    while ! docker logs $(docker ps -q -f "name=ldes-server$") 2> /dev/null | grep 'Cancelled mongock lock daemon' ; do sleep 1; done
    ```

2. Create LDES'es and their views using the [seed script](./server/seed/seed.sh):
    ```bash
    chmod +x ./server/seed/seed.sh
    sh ./server/seed/seed.sh
    ```
    > This will create the following LDES'es and views:
    ```
    curl http://${LOCALHOST}:8080/observations
    curl http://${LOCALHOST}:8080/observations/by-page
    ```

3. Start the LDIO workbench
    ```bash
    docker compose up nifi-workbench -d
    while ! curl --fail -I -s http://localhost:8000/nifi/ ; do sleep 1; done
    ```
    and then [logon to Apache NiFi](../../_nifi-workbench/README.md#logon-to-apache-nifi) user interface at http://localhost:8000/nifi and [create a workflow](../../_nifi-workbench/README.md#create-a-workflow) from the [provided workflow](./nifi-workflow.json) and [start it](../../_nifi-workbench/README.md#start-a-workflow).

    Verify that the NiFi HTTP listener is ready (it should answer `OK`):
    ```bash
    curl http://localhost:9005/observations/healthcheck
    ```

## Test Execution
1. Start the JSON Data Generator to start receiving `WaterQualityObserved` messages:
    ```bash
    docker compose up test-message-generator -d
    ```

2. Verify if observations are being inserted on the sink (the number of members should increase over time)
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
    curl --location 'http://localhost:7200/repositories/observations' \
    --header 'Accept: application/x-sparqlstar-results+json' \
    --header 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode 'query=PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX sosa: <http://www.w3.org/ns/sosa/>
    PREFIX omObservation: <http://def.isotc211.org/iso19156/2011/Observation#>
    select * where { 
        ?observation <http://def.isotc211.org/iso19156/2011/SamplingFeature#SF_SamplingFeatureCollection.member> [
            omObservation:OM_Observation.observedProperty ?type ;
            omObservation:OM_Observation.result [
                <http://def.isotc211.org/iso19103/2005/UnitsOfMeasure#Measure.value> [
                        <https://schema.org/value> ?result
                    ] 
                ]
            ]
    }'
    ```


## Test Teardown

Stop and destroy all systems
```bash
docker compose rm -s -f -v test-message-generator
docker compose rm -s -f -v nifi-workbench
docker compose down
rm -f ./graphdb/init.lock
```
