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
1. Run all systems except the message generator by executing the following (bash) command:
    ```bash
    export LDES_SERVER=host.docker.internal
    docker compose up -d
    ```
    Please ensure that the LDES Server is ready to ingest by following the container logs until you see the following message `Cancelled mongock lock daemon`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
    ```
    Press `CTRL-C` to stop following the log.

    Please ensure that the Nifi Workbench is available by repeatedly execution this command until the response is HTTP 200:
    ```bash
    curl -I http://localhost:8000/nifi/
    ```
2. Verify GraphDB server with collection is available

    To verify the server is up and the collection is available, execute the following command. If it returns a HTTP code 200, everything is up and running. 

    ```bash
    curl -I --header 'Accept: text/plain' http://localhost:7200/repositories/observations/size
    ```    

3. [Logon to Apache NiFi](../../_nifi-workbench/README.md#logon-to-apache-nifi) user interface at http://localhost:8000/nifi and [create a workflow](../../_nifi-workbench/README.md#create-a-workflow) from the [provided workflow](./data/NiFi_Workbench_Components.json) and [start it](../../_nifi-workbench/README.md#start-a-workflow).

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

1. stop message generation
    ```bash
    docker compose stop test-message-generator
    ```

2. stop and destroy all remaining systems
    ```bash
    docker compose rm -s -f -v test-message-generator
    docker compose down
    rm -f ./data/graphdb/init.lock
    ```
