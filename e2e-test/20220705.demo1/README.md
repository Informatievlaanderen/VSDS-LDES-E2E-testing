# Demo 1 - July, 5th 2022

This test demonstrates user story **As a data intermediary I want to request the fragmented GIPOD LDES data set.** (VSDSPUB-62).

> **Note**: currently, there is no automated test for this demo.

This LDES client E2E test is similar to the [second demo given on May, 24th](../20220524.demo-2/README.md).
The same context applies.

To demonstrate the correct working of the LDES client you need to:

1. [Start systems](#start-systems)
2. [Setup demo](#setup-demo)
3. [Scenario replication has not yet started](#scenario-replication-has-not-yet-started)
4. [Scenario replication has just started](#scenario-replication-has-just-started)
5. [Scenario data set contains 2 fragments](#scenario-data-set-contains-2-fragments)
6. [Scenario data set contains 3 fragments](#scenario-data-set-contains-3-fragments)
7. [Stop systems](#stop-systems)

## Start systems
To start the docker containers, you need to:
* create a [Github personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) (for scope `read:packages`)
* copy the [`.env.example`](./.env.example) file to `.env.user`
* fill in the credentials for Apache NiFi and the personal access token
* build and run the containers, passing your `.env.user` settings by executing in a bash shell:
```bash
docker compose --env-file .env.user up
```

This command will use the [docker-compose.yml](./docker-compose.yml) file found in this directory for building and running the following docker containers:
* LDES server at http://localhost:8080/mobility-hindrances (takes a few minutes)
* mongo database (the underlying storage for the LDES server)
* GIPOD simulator at http://localhost:9001/
* Apache NiFi (including LDES client processor) with user interface at https://localhost:8443/nifi (takes a few minutes)

## Setup demo
To setup the demo we need to create a new process group using a provided template and verify the connections:
* drag-n-drop the process group icon on the NiFi workpace
* optionally enter the process group name
* browse to the [pre-defined workflow](./replicate-workflow/replicate.nifi-workflow.json), select it and confirm the add action
* verify that the workflow is added
* open the workflow by double-clicking its title bar
* verify that the workflow contains two processors: an LDES client processor and an InvokeHTTP processor
* the `LdesClient` component property `Datasource url` should start with `http://gipod-server-simulator/api/v1/ldes/mobility-hindrances`
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-server/mobility-hindrances` and the property `HTTP method` should be `POST`

> **Note**: you should not yet start the workflow

We demonstrate a number of scenarios with the data set used during the [previous demo](../20220607.demo-1/README.md#setup-demo): 
* `alfa.json.ld` (250 items)
* `beta.json.ld` (250 items)
* `epsilon.json.ld` (117 items)

So, the total data set contains 617 items. We have [configured our LDES server](./ldes-server/config.local.env) to create fragments of 300 members. This means that:
* for testing the [first scenario](#scenario-replication-has-not-yet-started) we should not send anything to the simulator and expect an empty LDES
* for testing the [second scenario](#scenario-replication-has-just-started) we need to send the [alfa.jsonld](./gipod-server-simulator/data/scenario2/alfa.jsonld) file and expect to get one (incomplete, *mutable*) fragment
* for testing the [third scenario](#scenario-data-set-contains-2-fragments) we need to send the [alfa.jsonld](./gipod-server-simulator/data/scenario3/alfa.jsonld) and [beta.jsonld](./gipod-server-simulator/data/scenario3/beta.jsonld) files and expect to see one *immutable* fragment complete with 300 members and one *mutable* fragment containing 200 members
* for testing the [fourth scenario](#scenario-data-set-contains-3-fragments) we need to send the the [alfa.jsonld](./gipod-server-simulator/data/scenario4/alfa.jsonld), [beta.jsonld](./gipod-server-simulator/data/scenario4/beta.jsonld) and [epsilon.jsonld](./gipod-server-simulator/data/scenario4/epsilon.jsonld) files, resulting in 2 complete fragments with 300 members each and an incomplete/mutable one with the remaining 17 items.

## Scenario replication has not yet started
```gherkin
Given an empty data set
When we request it from the LDES server consumption endpoint
Then we receive a valid LDES containing no members
```

To test this scenario, we need to simply request the (empty) collection (`-L` options is needed because a redirect will happen):
```bash
curl -L -H 'Accept: application/n-quads' http://localhost:8080/mobility-hindrances
```
results in a valid but empty LDES:
```
<http://localhost:8080/mobility-hindrances> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/ldes#EventStream> .
<http://localhost:8080/mobility-hindrances> <https://w3id.org/ldes#timestampPath> <http://www.w3.org/ns/prov#generatedAtTime> .
<http://localhost:8080/mobility-hindrances> <https://w3id.org/ldes#versionOf> <http://purl.org/dc/terms/isVersionOf> .
<http://localhost:8080/mobility-hindrances> <https://w3id.org/tree#shape> <https://private-api.gipod.test-vlaanderen.be/api/v1/ldes/mobility-hindrances/shape> .
```

## Scenario replication has just started
```gherkin
Given a data set containing one fragment
When we request it from the LDES server consumption endpoint
Then we receive a valid LDES containing all members
And the result contains no relations
```

First we upload the [alfa.jsonld](./gipod-server-simulator/data/scenario2/alfa.jsonld) file, then we start the [replication/synchronisation workflow](./replicate-workflow/replicate.nifi-workflow.json) and finally we request the collection repeatedly.

Upload the `alfa.jsonld` file to the [GIPOD server simulator](http://localhost:9001/):
```bash
curl -X POST http://localhost:9001/ldes -H 'Content-Type: application/json-ld' -d '@gipod-server-simulator/data/scenario2/alfa.jsonld'
```

To launch the workflow, ensure that no processor is selected (click in the workpace OR navigate back to the root process group and select the newly added process group) and click the start button.

Request the collection http://localhost:8080/mobility-hindrances using [Postman](https://www.postman.com/). The response should be a fragment containing 250 items, no header `Cache-Control: immutable` and should not contain any `GreaterThanOrEqualToRelation` nor `LessThanOrEqualToRelation`.

## Scenario data set contains 2 fragments
```gherkin
Given a data set containing two fragments
When we request it from the LDES server consumption endpoint
Then the first fragment is marked as the root node
And the first fragment contains exact threshold members
And the first fragment contains a link to the last fragment
And the last fragment contains less than threshold members
And the last fragment contains a reverse link to the first fragment
And the response of the last fragment should contain a Cache-Control header
```

Upload the `alfa.jsonld` and `beta.jsonld` files to the [GIPOD server simulator](http://localhost:9001/):
```bash
curl -X POST http://localhost:9001/ldes -H 'Content-Type: application/json-ld' -d '@gipod-server-simulator/data/scenario3/alfa.jsonld'
curl -X POST http://localhost:9001/ldes -H 'Content-Type: application/json-ld' -d '@gipod-server-simulator/data/scenario3/beta.jsonld'
```

Request the collection http://localhost:8080/mobility-hindrances. This results in the first fragment, validate the `Cache-Control` header (`immutable`), search for the `tree#relation`, note the `GreaterThanOrEqualToRelation` (**no** `LesserThanOrEqualToRelation`) and follow it to the next/last fragment. Validate the `Cache-Control` header (**not** `immutable`), search for the `tree#relation`, note the `LesserThanOrEqualToRelation` (**no** `GreaterThanOrEqualToRelation`) and follow it to the previous/first fragment.

## Scenario data set contains 3 fragments
```gherkin
Given a data set containing three fragments
When we request it from the LDES server consumption endpoint
Then the first fragment is marked as the root node
And the first fragment contains exact threshold members
And the first fragment contains a link to the middle fragment
And the middle fragment contains exact threshold members
And the middle fragment contains a link to the last fragment
And the middle fragment contains a reverse link to the first fragment
And the last fragment contains less than threshold members
And the last fragment contains a reverse link to the middle fragment
And the response of the last fragment should contain a Cache-Control header
```

Upload the `alfa.jsonld`, `beta.jsonld` and `epsilon.jsonld` fils to the [GIPOD server simulator](http://localhost:9001/):
```bash
curl -X POST http://localhost:9001/ldes -H 'Content-Type: application/json-ld' -d '@gipod-server-simulator/data/scenario4/alfa.jsonld'
curl -X POST http://localhost:9001/ldes -H 'Content-Type: application/json-ld' -d '@gipod-server-simulator/data/scenario4/beta.jsonld'
curl -X POST http://localhost:9001/ldes -H 'Content-Type: application/json-ld' -d '@gipod-server-simulator/data/scenario4/epsilon.jsonld'
```

Request the collection http://localhost:8080/mobility-hindrances. This results in the first fragment, validate the `Cache-Control` header (`immutable`), search for the `tree#relation`, note the `GreaterThanOrEqualToRelation` (**no** `LesserThanOrEqualToRelation`) and follow it to the next/middle fragment. Validate the `Cache-Control` header (`immutable`), search for the `tree#relation`, note both the `LesserThanOrEqualToRelation` and `GreaterThanOrEqualToRelation` and follow the latter to the next/last fragment. Validate the `Cache-Control` header (**not** `immutable`), search for the `tree#relation`, note the `LesserThanOrEqualToRelation` (**no** `GreaterThanOrEqualToRelation`) and follow it to the previous/middle fragment.

## Stop systems
To stop all docker containers, you need to execute the following shell commands in a terminal:
```bash
docker compose down
```

This will gracefully shutdown all containers used in the E2E test.
