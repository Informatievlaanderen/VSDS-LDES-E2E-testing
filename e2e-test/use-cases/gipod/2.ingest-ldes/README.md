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
For this scenario we can use the [Simulator / Workflow / Server / Mongo](../../../support/context/simulator-workflow-server-mongo/README.md) context. Please copy the [environment file (env.ingest)](./env.ingest) to a personal file (e.g. `env.user`) and fill in the mandatory arguments. 

> **Note**: you can set the `COMPOSE_FILE` environment property to the [docker compose file](../../../support/context/simulator-workflow-server-mongo/docker-compose.yml) so you do not need to provide it in each docker compose command. E.g.:
```bash
export COMPOSE_FILE="../../../support/context/simulator-workflow-server-mongo/docker-compose.yml"
```

Then you can run the systems by executing the following command:
```bash
docker compose --env-file env.user up
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
Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file.

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

In addition, you can request the members using various formats:

Get [N-Quads](https://www.w3.org/TR/n-quads/):
```bash
curl --location --header 'Accept: application/n-quads' http://localhost:8080/mobility-hindrances
```
response:
```
_:B321b4a2f3ec6819fcbb4511b3f886dce <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/locn#Geometry> .
_:B321b4a2f3ec6819fcbb4511b3f886dce <http://www.opengis.net/ont/geosparql#asWKT> "POLYGON ((91146.48 185768.42, 91151.18 185771.19, 91151.5 185775.19, 91155.32 185773.81, 91158.95 185777.2, 91161.69 185771.57, 91168.28 185771.21, 91165.19 185766.29, 91171.36 185761.23, 91164.84 185757.35, 91165.96 185751.38, 91161.51 185753.75, 91157.04 185748.26, 91153.93 185755.41, 91147.59 185755.98, 91149.87 185762.64, 91146.48 185768.42))"^^<http://www.opengis.net/ont/geosparql#wktLiteral> .
_:Bad475b7e7c9e493231ad2d5c794ec317 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/adms#Identifier> .
_:Bad475b7e7c9e493231ad2d5c794ec317 <http://www.w3.org/2004/02/skos/core#notation> "10773773"^^<https://gipod.vlaanderen.be/ns/gipod#gipodId> .
_:Bad475b7e7c9e493231ad2d5c794ec317 <http://www.w3.org/ns/adms#schemaAgency> "https://gipod.vlaanderen.be"@nl-be .
_:Bf91e7f1f9d662b09f9ebd66defbed583 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/locn#Geometry> .
_:Bf91e7f1f9d662b09f9ebd66defbed583 <http://www.opengis.net/ont/geosparql#asWKT> "MULTIPOLYGON (((177326.16 232463.7, 177327.78 232469.48, 177330.2 232468.8, 177328.57 232463.03, 177326.16 232463.7)), ((177323.59 232475.24, 177318.77 232476.59, 177320.12 232481.4, ...(omitted details)...)))"^^<http://www.opengis.net/ont/geosparql#wktLiteral> .
<https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/1838671> <https://data.vlaanderen.be/ns/mobiliteit#beheerder> <https://private-api.gipod.beta-vlaanderen.be/api/v1/organisations/fedab33f-792a-029c-9b34-9d9cfe7d6245> .
<https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/1838671> <https://data.vlaanderen.be/ns/mobiliteit#zone> <https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/zones/d0f9148d-3aa6-496e-a1e1-93b585aa7235> .
<https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/1838671> <http://purl.org/dc/terms/description> "8530 Harelbeke, Frankrijklaan 7: Container"^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString> .
<https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/1838671> <http://www.w3.org/ns/adms#versionNotes> "MobilityHindranceContactOrganisationWasAdded"@nl-be .
<https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/1838671> <http://purl.org/dc/terms/isVersionOf> <https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542> .
<https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/1838671> <http://www.w3.org/ns/adms#identifier> _:B45c90c0fb17654ba124c1cdbd152f787 .
<https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/1838671> <http://www.w3.org/ns/prov#generatedAtTime> "2022-04-20T08:53:33.69Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
<https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/1838671> <https://data.vlaanderen.be/ns/mobiliteit#Inname.status> <https://private-api.gipod.beta-vlaanderen.be/api/v1/taxonomies/statuses/0a4ee99b-8b8a-47c8-913f-117220febee0> .

(omitted many lines)
```
Get [JSON-LD](https://www.w3.org/TR/json-ld11/)
```bash
curl --location --header 'Accept: application/ld+json' http://localhost:8080/mobility-hindrances
```
response:
```json
{
    "@graph": [
        {
            "@id": "_:b0",
            "@type": "http://data.europa.eu/m8g/PeriodOfTime",
            "http://data.europa.eu/m8g/endTime": {
                "@value": "2024-04-19T22:00:00Z",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
            },
            "http://data.europa.eu/m8g/startTime": {
                "@value": "2022-06-19T22:00:00Z",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
            }
        },
        {
            "@id": "_:b1",
            "@type": "http://www.w3.org/ns/locn#Geometry",
            "http://www.opengis.net/ont/geosparql#asWKT": {
                "@value": "POLYGON ((189788.89 211295.21, 189791.43 211290.33, 189793.66 211291.48, 189791.12 211296.36, 189788.89 211295.21))",
                "@type": "http://www.opengis.net/ont/geosparql#wktLiteral"
            }
        },
        {
            "@id": "_:b2",
            "@type": "http://www.w3.org/ns/locn#Geometry",
            "http://www.opengis.net/ont/geosparql#asWKT": {
                "@value": "MULTIPOLYGON (((177333.3 232471.99, 177332.6 232469.49, 177327.77 232470.84, 177328.48 232473.34, 177329.18 232475.84, 177329.89 232478.35, 177330.59 232480.85, 177331.3 232483.35, 177336.12 232482, 177335.42 232479.5, 177334.71 232476.99, 177334.01 232474.49, 177333.3 232471.99)), ((177323.59 232475.24, 177318.77 232476.59, 177320.12 232481.4, 177324.95 232480.05, 177323.59 232475.24)), ((177326.16 232463.7, 177327.78 232469.48, 177330.2 232468.8, 177328.57 232463.03, 177326.16 232463.7)), ((177316.46 232476.43, 177327.48 232473.42, 177324.92 232463.81, 177332.31 232461.34, 177331.49 232458.26, 177312.88 232463.38, 177316.46 232476.43)), ((177327.66 232498.94, 177327.76 232499.29, 177327.9 232499.61, 177328.08 232499.87, 177328.29 232500.08, 177328.52 232500.21, 177338.48 232504.46, 177338.71 232504.52, 177357.51 232506.85, 177374.3 232510.73, 177391.03 232516.3, 177391.09 232516.32, 177397.33 232517.94, 177397.58 232517.96, 177397.82 232517.91, 177398.06 232517.78, 177398.27 232517.58, 177398.45 232517.32, 177398.6 232517.01, 177398.71 232516.66, 177398.78 232516.28, 177398.79 232515.89, 177398.76 232515.5, 177398.68 232515.13, 177398.56 232514.79, 177398.4 232514.49, 177398.2 232514.25, 177397.98 232514.08, 177397.75 232513.98, 177391.53 232512.37, 177374.79 232506.8, 177374.71 232506.78, 177357.84 232502.87, 177357.76 232502.86, 177339.03 232500.54, 177329.82 232496.62, 177326.93 232483.18, 177326.83 232482.82, 177326.69 232482.5, 177326.51 232482.24, 177326.3 232482.03, 177326.07 232481.9, 177325.83 232481.83, 177325.58 232481.85, 177325.34 232481.94, 177325.12 232482.11, 177324.92 232482.34, 177324.75 232482.63, 177324.62 232482.96, 177324.54 232483.33, 177324.5 232483.72, 177324.51 232484.11, 177324.56 232484.49, 177327.66 232498.94)))",
                "@type": "http://www.opengis.net/ont/geosparql#wktLiteral"
            }
        },
        {
            "@id": "_:b3",
            "@type": "http://www.w3.org/ns/adms#Identifier",
            "http://www.w3.org/2004/02/skos/core#notation": {
                "@value": "10773542",
                "@type": "https://gipod.vlaanderen.be/ns/gipod#gipodId"
            },
            "http://www.w3.org/ns/adms#schemaAgency": {
                "@language": "nl-be",
                "@value": "https://gipod.vlaanderen.be"
            }
        },
        {
            "@id": "_:b4",
            "@type": "http://www.w3.org/ns/adms#Identifier",
            "http://www.w3.org/2004/02/skos/core#notation": {
                "@value": "10773600",
                "@type": "https://gipod.vlaanderen.be/ns/gipod#gipodId"
            },
            "http://www.w3.org/ns/adms#schemaAgency": {
                "@language": "nl-be",
                "@value": "https://gipod.vlaanderen.be"
            }
        },
        {
            "@id": "_:b5",
            "@type": "http://www.w3.org/ns/locn#Geometry",
            "http://www.opengis.net/ont/geosparql#asWKT": {
                "@value": "POLYGON ((229657.22 184600.56, 229657.14 184605.56, 229662.15 184605.64, 229662.23 184600.64, 229657.22 184600.56))",
                "@type": "http://www.opengis.net/ont/geosparql#wktLiteral"
            }
        },
        {
            "@id": "_:b6",
            "@type": "http://www.w3.org/ns/locn#Geometry",
            "http://www.opengis.net/ont/geosparql#asWKT": {
                "@value": "POLYGON ((229785.96 184270.46, 229783.98 184264.04, 229793.63 184261.93, 229795.23 184268.16, 229785.96 184270.46))",
                "@type": "http://www.opengis.net/ont/geosparql#wktLiteral"
            }
        },
        {
            "@id": "_:b7",
            "@type": "http://www.w3.org/ns/locn#Geometry",
            "http://www.opengis.net/ont/geosparql#asWKT": {
                "@value": "POLYGON ((170485.68 200968.28, 170485.66 200973.28, 170490.68 200973.3, 170490.69 200968.3, 170485.68 200968.28))",
                "@type": "http://www.opengis.net/ont/geosparql#wktLiteral"
            }
        },
        {
            "@id": "_:b8",
            "@type": "http://data.europa.eu/m8g/PeriodOfTime",
            "http://data.europa.eu/m8g/endTime": {
                "@value": "2022-06-01T18:00:00Z",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
            },
            "http://data.europa.eu/m8g/startTime": {
                "@value": "2022-06-01T04:00:00Z",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
            }
        },
        {
            "@id": "https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/1838671",
            "https://data.vlaanderen.be/ns/mobiliteit#beheerder": {
                "@id": "https://private-api.gipod.beta-vlaanderen.be/api/v1/organisations/fedab33f-792a-029c-9b34-9d9cfe7d6245"
            },
            "https://data.vlaanderen.be/ns/mobiliteit#zone": {
                "@id": "https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/zones/d0f9148d-3aa6-496e-a1e1-93b585aa7235"
            },
            "http://purl.org/dc/terms/description": {
                "@value": "8530 Harelbeke, Frankrijklaan 7: Container",
                "@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString"
            },
            "http://www.w3.org/ns/adms#versionNotes": {
                "@language": "nl-be",
                "@value": "MobilityHindranceContactOrganisationWasAdded"
            },
            "http://purl.org/dc/terms/isVersionOf": {
                "@id": "https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542"
            },
            "http://www.w3.org/ns/prov#generatedAtTime": {
                "@value": "2022-04-20T08:53:33.69Z",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
            },
            "https://data.vlaanderen.be/ns/mobiliteit#Inname.status": {
                "@id": "https://private-api.gipod.beta-vlaanderen.be/api/v1/taxonomies/statuses/0a4ee99b-8b8a-47c8-913f-117220febee0"
            },
            "http://purl.org/dc/terms/modified": {
                "@value": "2022-04-20T08:53:33.7043281Z",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
            },
            "https://data.vlaanderen.be/ns/mobiliteit#periode": {
                "@id": "_:b9"
            },
            "https://data.vlaanderen.be/ns/mobiliteit#contactOrganisatie": {
                "@id": "https://private-api.gipod.beta-vlaanderen.be/api/v1/mobility-hindrances/10773542/contactorganisations/8fe1dbb3-9620-4d45-9d08-940c861e6994"
            },
            "http://purl.org/dc/elements/1.1/contributor": {
                "@id": "https://private-api.gipod.beta-vlaanderen.be/api/v1/organisations/fedab33f-792a-029c-9b34-9d9cfe7d6245"
            },
            "http://www.w3.org/ns/adms#identifier": {
                "@id": "_:b10"
            },
            "http://purl.org/dc/elements/1.1/creator": {
                "@id": "https://private-api.gipod.beta-vlaanderen.be/api/v1/organisations/fedab33f-792a-029c-9b34-9d9cfe7d6245"
            },
            "http://purl.org/dc/terms/created": {
                "@value": "2022-04-20T08:53:33.7012596Z",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
            },
            "https://gipod.vlaanderen.be/ns/gipod#gipodId": {
                "@value": "10773542",
                "@type": "http://www.w3.org/2001/XMLSchema#integer"
            },
            "@type": "https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder"
        }

    (omitted many objects)

    ]
}
```

### Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/simulator-workflow-sink/README.md#stop-the-systems), i.e.:
```bash
docker compose --env-file env.user down
```
