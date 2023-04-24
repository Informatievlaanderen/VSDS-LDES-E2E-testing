# NiFi Workbench Components Work As Expected

We verify the functionality of all the core components using LDIO workbench instead of with the NiFi workbench. In order to ensure that the NiFi components still work one or two E2E tests are needed which demonstrates the usage of the core components in a NiFi workflow and ensures the NiFi wrappers for these core components are correctly implemented and that these remain functional.

Create an E2E test combining all the NiFi components used for data publishing (NGSI v2 to LD adaptor, sparql construct & create version object).

Create an E2E test combining all the NiFi components used for data consumption (LDES client, GeoJSON to WKT, version materialization & RDF4J materialization).

Optionally, combine both tests in one E2E test.



**Goal**: Can create NiFi workflows with all LDES related components to demonstrate its usage, both for data publishing and data consumption

**Context**: docker compose with (use test-015 as basis)

* message generator (NGSI-v2 with 1 wqo), 
* NiFi workbench containing: 
    * data publishing workflow = HTTP listener => v2 to LD
        * => sparql construct (OSLO transformation) => version object creation => http out to LDES server observations
        * => sparql construct (extract refDevice + add dateLastValueReported = dateObserved) => version object creation => RD4J materialize
    * data consumption workflows:
        * observations = LDES client for observations => convert GeoJSON to WKT => version materialize => send to message sink
        * sparql Select? => create some object => send to message sink
* LDES server holding both observations and devices LDES, both paginated
* test message sink for capturing observations (state objects)
* RDF4J system for capturing device info (state objects)

## Test Setup
1. Run all systems except the message generator by executing the following (bash) command:
    ```bash
    docker compose up -d
    ```
    Please ensure that the LDES Server is ready to ingest by following the container logs until you see the following message `Mongock has finished`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
    ```
    Press `CTRL-C` to stop following the log.

    Please ensure that the Nifi Workbench is available by repeatedly execution this command until the response is HTTP 200:
    ```bash
    curl -I http://localhost:8000/nifi/
    ```
> **TODO**: RDF4J to be available

2. Create the test RDF4J repository
- Browse to the [RDF4J Workbench](http://localhost:9004/rdf4j-workbench)
- Click on 'New repository'
- Select type 'Memory Store', give it the id 'test' and click 'Next'
- On the next page, select 'In Memory Store' and click 'Create'

3. [Logon to Apache NiFi](../../_nifi-workbench/README.md#logon-to-apache-nifi) user interface at http://localhost:8000/nifi and [create a workflow](../../_nifi-workbench/README.md#create-a-workflow) from the [provided workflow](./data/NiFi_Workbench_Components.json) and [start it](../../_nifi-workbench/README.md#start-a-workflow).

    Verify that the NiFi HTTP listener is ready (it should answer `OK`):
    ```bash
    curl http://localhost:9005/observations/healthcheck
    ```

## Test Execution
2. Start the JSON Data Generator to start receiving `WaterQualityObserved` messages:
    ```bash
    docker compose up test-message-generator -d
    ```

3. verify observation is being update (observation date) - using the message sink (also check count = 1)

4. request the observation from the message sink and validate the OSLO state model - note the device reference and observation date

5. verify the presence of a asWkt with a WktLiteral value

6. verify device is being updated with the same date in the RDF4J data store

## Test Teardown

1. stop message generation

2. stop and destroy all remaining systems
