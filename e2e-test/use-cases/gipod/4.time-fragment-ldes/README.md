# LDES Server Can Time-fragment an LDES
This test validates user story **As a data intermediary I want to request the fragmented GIPOD LDES data set.** (VSDSPUB-62) and was shown during demo 1 on July, 5th 2022.

## Scenario: Replication has not yet Started
This scenario verifies that the LDES server can return an empty data set.
```gherkin
Given an empty data set
When we request it from the LDES server consumption endpoint
Then we receive a valid LDES containing no members
```

## Scenario: Replication has just Started
This scenario verifies that the LDES server can return a fragment without relation links to other fragments.
```gherkin
Given a data set containing one fragment
When we request it from the LDES server consumption endpoint
Then we receive a valid LDES containing all members
And the result contains no relations
```

## Scenario: Data Set Contains 2 Fragments
This scenario verifies that the LDES server can return 2 fragments with relation links to the other fragment.
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

## Scenario: Data Set Contains 3 Fragments
This scenario verifies that the LDES server returns fragments with relation links to the previous and next fragment for all fragments but the first and last ones.
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

### Test Setup
For all these scenarios we can use the [Simulator / Workflow / Server / Mongo](../../../support/context/simulator-workflow-server-mongo/README.md) context. Please copy the [environment file (env.time-fragment)](./env.time-fragment) to a personal file (e.g. `env.user`) and fill in the mandatory arguments. 

> **Note**: you can set the `COMPOSE_FILE` environment property to the [docker compose file](../../../support/context/simulator-workflow-server-mongo/docker-compose.yml) so you do not need to provide it in each docker compose command. E.g.:
```bash
export COMPOSE_FILE="../../../support/context/simulator-workflow-server-mongo/docker-compose.yml"
```

Then you can run the systems by executing the following command:
```bash
docker compose --env-file env.user up
```

Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file.

Once logged in, create a new process group based on the [ingest workflow](./nifi-workflow.json) as specified in [here](../../../support/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the LDES-server.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances`
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-server:8080/mobility-hindrances` and the property `HTTP method` should be `POST`

The different scenarios can be tested with the following data set: 
* `alfa.json.ld` (250 items)
* `beta.json.ld` (250 items)
* `epsilon.json.ld` (117 items)

So, the total data set contains 617 items. We have [configured our LDES Server](./env.time-fragment) deliberately to create fragments of 300 members to be able to easily test each scenario.

#### Recreate Containers Between the Scenarios
All scenarios but the first use a **different subset** of the data set used for [testing synchronization](../3.synchronize-ldes/README.md). Therefore, to test the scenarios you need to recreate all containers between scenarios to ensure a clean environment. To recreate the containers:
```bash
docker compose --env-file env.user down
docker compose --env-file env.user up
```

You also need to re-import the workflow: log on again to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file and create a new process group based on the [ingest workflow](./nifi-workflow.json) as specified in [here](../../../support/workflow/README.md#creating-a-workflow).

### Test Execution
> **Note**: the first scenario is already implicitly tested by the [LDES Server verification step](../../../support/context/simulator-workflow-server-mongo/README.md#ldes-server).

#### Test and Verify Scenario 2
For testing the second scenario we need to send the [scenario 2 alfa.jsonld](./data/scenario2/alfa.jsonld) file which contains 250 members and we expect to get one (incomplete, *mutable*) fragment, as the fragment size is configured to be 300.

1. Upload the `alfa.jsonld` file to the [simulator](http://localhost:9011/):
```bash
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/json-ld' -d '@data/scenario2/alfa.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```
2. Start the workflow as described [here](../../../support/workflow/README.md#starting-a-workflow).
3. Request the collection http://localhost:8080/mobility-hindrances using [Postman](https://www.postman.com/) or use [Chrome DevTools](https://developer.chrome.com/docs/devtools/) to view the response headers.

The response should be a fragment containing 250 items, no header `Cache-Control: immutable` and should not contain any `GreaterThanOrEqualToRelation` nor `LessThanOrEqualToRelation`.

#### Test and Verify Scenario 3
For testing the third scenario we need to send the [scenario 3 alfa.jsonld](./data/scenario3/alfa.jsonld) and [scenario 3 beta.jsonld](./data/scenario3/beta.jsonld) files and expect to see one *immutable* fragment complete with 300 members and one *mutable* fragment containing 200 members.

1. Recreate the container as described [here](#recreate-containers-between-the-scenarios).
2. Upload the `alfa.jsonld` and `beta.jsonld` files to the [simulator](http://localhost:9011/):
```bash
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/json-ld' -d '@data/scenario3/alfa.jsonld'
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/json-ld' -d '@data/scenario3/beta.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```
3. Start the workflow as described [here](../../../support/workflow/README.md#starting-a-workflow).
4. Request the collection http://localhost:8080/mobility-hindrances. 

This results in the first fragment, validate the `Cache-Control` header (`immutable`), search for the `tree#relation`, note the `GreaterThanOrEqualToRelation` (**no** `LesserThanOrEqualToRelation`) and follow it to the next/last fragment.

In this fragment validate the `Cache-Control` header (**not** `immutable`), search for the `tree#relation`, note the `LesserThanOrEqualToRelation` (**no** `GreaterThanOrEqualToRelation`) and follow it to the previous/first fragment.

#### Test and Verify Scenario 4
For testing the fourth scenario we need to send the the [scenario 4 alfa.jsonld](./data/scenario4/alfa.jsonld), [scenario 4 beta.jsonld](./data/scenario4/beta.jsonld) and [scenario 4 epsilon.jsonld](./data/scenario4/epsilon.jsonld) files, resulting in 2 complete fragments with 300 members each and an incomplete/mutable one with the remaining 17 items.

1. Recreate the container as described [here](#recreate-containers-between-the-scenarios).
2. Upload the `alfa.jsonld`, `beta.jsonld` and `epsilon.jsonld` fils to the [simulator](http://localhost:9011/):
```bash
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/json-ld' -d '@data/scenario4/alfa.jsonld'
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/json-ld' -d '@data/scenario4/beta.jsonld'
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/json-ld' -d '@data/scenario4/epsilon.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```
3. Start the workflow as described [here](../../../support/workflow/README.md#starting-a-workflow).
4. Request the collection http://localhost:8080/mobility-hindrances.

This results in the first fragment, validate the `Cache-Control` header (`immutable`), search for the `tree#relation`, note the `GreaterThanOrEqualToRelation` (**no** `LesserThanOrEqualToRelation`) and follow it to the next/middle fragment.

In this fragment validate the `Cache-Control` header (`immutable`), search for the `tree#relation`, note both the `LesserThanOrEqualToRelation` and `GreaterThanOrEqualToRelation` and follow the latter to the next/last fragment.

In this fragment validate the `Cache-Control` header (**not** `immutable`), search for the `tree#relation`, note the `LesserThanOrEqualToRelation` (**no** `GreaterThanOrEqualToRelation`) and follow it to the previous/middle fragment.

In this fragment  search for the `tree#relation`, note the `LesserThanOrEqualToRelation` and follow it to the previous/first fragment.

### Test Teardown
First stop the workflow as described [here](../../../support/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/simulator-workflow-sink/README.md#stop-the-systems), i.e.:
```bash
docker compose --env-file env.user down
```
