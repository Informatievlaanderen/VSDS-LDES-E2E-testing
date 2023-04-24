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
        * => sparql select (extract refDevice + add dateLastValueReported = dateObserved) => version object creation  =>  => http out to LDES server devices
    * data consumption workflows:
        * observations = LDES client for observations => convert GeoJSON to WKT => version materialize => send to message sink
        * devices = LDES client for devices => RDF4J materialization
* LDES server holding both observations and devices LDES, both paginated
* test message sink for capturing observations (state objects)
* RDF4J system for capturing device info (state objects)

## Test Setup
1. start systems (except message generator)

2. wait for LDES server, NiFi system and RDF4J to be available

## Test Execution

1. open NiFi UI, load & start workflows

2. start message generation

3. verify observation is being update (observation date) - using the message sink (also check count = 1)

4. request the observation from the message sink and validate the OSLO state model - note the device reference and observation date

5. verify the presence of a asWkt with a WktLiteral value

6. verify device is being updated with the same date in the RDF4J data store

## Test Teardown

1. stop message generation

2. stop and destroy all remaining systems
