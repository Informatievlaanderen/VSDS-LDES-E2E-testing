# LDES Server Can Ingest LDES Members
This test validates user story **As a data intermediary I want to request the GIPOD LDES data set without fragmentation** (VSDSPUB-61) and was shown during demo 2 on May, 24th 2022.

## Scenario: the Server Ingests N-quads
This scenario verifies that the LDES server can ingest [N-Quads](https://www.w3.org/TR/n-quads/).
```gherkin
Given an LDES member formatted as N-quads
When we send it to the LDES server ingest endpoint
Then the LDES server accepts it
```

## Scenario: the Server Returns N-quads
This scenario verifies the LDES server can return the unfragmented LDES as N-Quads.
```gherkin
Given a data set is already stored
When we request it from the LDES server consumption endpoint, formatted as N-quads
Then we receive the LDES formatted as N-quads
```

## Scenario: the Server Returns Turtle Format
This scenario verifies the LDES server can return the unfragmented LDES as other formats (such as [Turtle](https://www.w3.org/TR/turtle/), [N-triples](https://www.w3.org/TR/n-triples/), [JSON-LD](https://www.w3.org/TR/json-ld11/), etc.).
```gherkin
Given a data set is already stored
When we request it from the LDES server consumption endpoint, formatted as Turtle
Then we receive the LDES formatted as Turtle
```

## Scenario: the Server Returns the Data Set in an Unfragmented LDES
This scenario verifies the LDES server ingesting a small number of members and serves them as an unfragmented LDES.
```gherkin
Given a data set contains a (small) number of members, which fit in one response
When we request it from the LDES server consumption endpoint
Then we receive the LDES containing all members
And the result contains no fragmentation
```
> **Note**: we use 4 fragments containing 250 members each and 1 (last) fragment containing 16 members (small subset of the GIPOD).

### Test Setup
For this scenario we can use the [Simulator / Workflow / Server / Mongo](../../../support/context/simulator-workflow-server-mongo/README.md) context. Please copy the [environment file (ingest.env)](./ingest.env) to a personal file (e.g. `user.env`) and fill in the mandatory arguments. 

> **Note**: you can set the `COMPOSE_FILE` environment property to the [docker compose file](../../../support/context/simulator-workflow-server-mongo/docker-compose.yml) so you do not need to provide it in each docker compose command. E.g.:
```bash
export COMPOSE_FILE="../../../support/context/simulator-workflow-server-mongo/docker-compose.yml"
```

Then you can run the systems by executing the following command:
```bash
docker compose --env-file user.env up
```

The data set is already seeded (see [simulator](http://localhost:9011)). We only need to [alias it](./create-alias.json):
```bash
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```

### Test Execution
To run the test, you need to:
1. Upload a pre-defined NiFi workflow containing the LDES client processor and a InvokeHTTP processor (to send the LDES members to the LDES server).
2. Start the NiFi workflow and wait for it to process all LDES members.
3. Verify that all LDES members from the GIPOD simulator are received by the LDES-server.

#### 1. Upload NiFi Workflow
Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `user.env` file.

Once logged in, create a new process group based on the [ingest workflow](./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the LDES-server.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances`
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-server:8080/mobility-hindrances` and the property `HTTP method` should be `POST`

#### 2. Start the Workflow
Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).

#### 3. Verify LDES Members Received
The GIPOD simulator (http://localhost:9011) is seeded by a subset of the GIPOD dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served.

You can verify that, after some time, all (1016) LDES members are received by the LDES-server by using the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `test.ldesmember` document collection contains the LDES members (check the document count):
![test.ldesmember document count](./artwork/test-ldesmember-document-count.png)

To get the **LDES** (event stream) itself use:
```bash
curl http://localhost:8080/mobility-hindrances
```
response:
```
@prefix ldes:                <https://w3id.org/ldes#> .
@prefix mobility-hindrances: <https://private-api.gipod.test-vlaanderen.be/api/v1/ldes/mobility-hindrances/> .
@prefix tree:                <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances>
        a           ldes:EventStream ;
        tree:shape  mobility-hindrances:shape ;
        tree:view   <http://localhost:8080/mobility-hindrances/by-time> .
```
You can follow the `tree:view` link to get the **view**:
```bash
curl http://localhost:8080/mobility-hindrances/by-time
```
response:
```
@prefix tree: <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances/by-time>
        a              tree:Node ;
        tree:relation  [ a          tree:Relation ;
                         tree:node  <http://localhost:8080/mobility-hindrances/by-time?generatedAtTime=2022-10-10T12:29:14.172Z>
                       ] .
```
Which allows you to follow the `tree:node` and retrieve the **fragment** containing the members:
```
curl http://localhost:8080/mobility-hindrances/by-time?generatedAtTime=2022-10-10T12:29:14.172Z
```
response:
```
@prefix adms:                 <http://www.w3.org/ns/adms#> .
@prefix consequencetypes:     <https://private-api.gipod.beta-vlaanderen.be/api/v1/taxonomies/mobility-hindrance/consequencetypes/> .
@prefix contactorganisations: <https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10770700/contactorganisations/> .
@prefix core:                 <http://www.w3.org/2004/02/skos/core#> .
@prefix geosparql:            <http://www.opengis.net/ont/geosparql#> .
@prefix gipod:                <https://gipod.vlaanderen.be/ns/gipod#> .
@prefix ldes:                 <https://w3id.org/ldes#> .
@prefix locn:                 <http://www.w3.org/ns/locn#> .
@prefix m8g:                  <http://data.europa.eu/m8g/> .
@prefix org:                  <http://www.w3.org/ns/org#> .
@prefix organisations:        <https://private-api.gipod.beta-vlaanderen.be/api/v1/organisations/> .
@prefix prov:                 <http://www.w3.org/ns/prov#> .
@prefix statuses:             <https://private-api.gipod.beta-vlaanderen.be/api/v1/taxonomies/statuses/> .
@prefix terms:                <http://purl.org/dc/terms/> .
@prefix tree:                 <https://w3id.org/tree#> .
@prefix zones:                <https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773891/zones/> .

<https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/1838671>
        a                     <https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder> ;
        <http://purl.org/dc/elements/1.1/contributor>
                organisations:fedab33f-792a-029c-9b34-9d9cfe7d6245 ;
        <http://purl.org/dc/elements/1.1/creator>
                organisations:fedab33f-792a-029c-9b34-9d9cfe7d6245 ;
        terms:created         "2022-04-20T08:53:33.7012596Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
        terms:description     "8530 Harelbeke, Frankrijklaan 7: Container"^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString> ;
        terms:isVersionOf     <https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542> ;
        terms:modified        "2022-04-20T08:53:33.7043281Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
        adms:identifier       [ a                  adms:Identifier ;
                                core:notation      "10773542"^^gipod:gipodId ;
                                adms:schemaAgency  "https://gipod.vlaanderen.be"@nl-BE
                              ] ;
        adms:versionNotes     "MobilityHindranceContactOrganisationWasAdded"@nl-BE ;
        prov:generatedAtTime  "2022-04-20T08:53:33.69Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
        <https://data.vlaanderen.be/ns/mobiliteit#Inname.status>
                statuses:0a4ee99b-8b8a-47c8-913f-117220febee0 ;
        <https://data.vlaanderen.be/ns/mobiliteit#beheerder>
                organisations:fedab33f-792a-029c-9b34-9d9cfe7d6245 ;
        <https://data.vlaanderen.be/ns/mobiliteit#contactOrganisatie>
                <https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/contactorganisations/8fe1dbb3-9620-4d45-9d08-940c861e6994> ;
        <https://data.vlaanderen.be/ns/mobiliteit#periode>
                [ a              m8g:PeriodOfTime ;
                  m8g:endTime    "2022-05-01T18:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
                  m8g:startTime  "2022-04-27T04:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>
                ] ;
        <https://data.vlaanderen.be/ns/mobiliteit#zone>
                <https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/zones/d0f9148d-3aa6-496e-a1e1-93b585aa7235> ;
        gipod:gipodId         10773542 .
...
```

> **Note**: you can verify that the fragment contains 1016 members by capturing the response to a file and counting the number of occurrences of `<https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder>`. E.g.:
>```
> curl --silent http://localhost:8080/mobility-hindrances/by-time?generatedAtTime=2022-10-10T12:29:14.172Z | grep "<https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder>" | wc -l
>```
>response: 1016

In addition, you can request the members using various other formats:

Get [N-Quads](https://www.w3.org/TR/n-quads/) (fast):
```bash
curl --header 'Accept: application/n-quads' http://localhost:8080/mobility-hindrances/by-time?generatedAtTime=2022-10-10T12:29:14.172Z
```

Get [JSON-LD](https://www.w3.org/TR/json-ld11/) (slow):
```bash
curl --header 'Accept: application/ld+json' http://localhost:8080/mobility-hindrances/by-time?generatedAtTime=2022-10-10T12:29:14.172Z
```

### Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/simulator-workflow-sink/README.md#stop-the-systems), i.e.:
```bash
docker compose --env-file user.env down
```
