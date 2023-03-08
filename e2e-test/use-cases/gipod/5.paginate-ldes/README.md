# LDES Server Can Fragment an LDES Using Simple Pagination
This test validates user story **Server -> Develop pagination** (VSDSPUB-423) and was shown during demo on February, 14th 2023.

## Scenario: Data Set Contains 3 Fragments
This scenario verifies that the LDES server returns fragments with simple relation links to the previous and next fragment for all fragments but the first and last ones.
```gherkin
  Scenario: Fragment LDES Using Simple Pagination
    Given the paginate-ldes test is setup
    And context 'use-cases/gipod/5.paginate-ldes' is started
    And I have uploaded the paginate-ldes data set
    And the LDES workbench is available
    And I have uploaded '5.paginate-ldes' workflow
    When I start the workflow
    Then the LDES contains 617 members
    And the first fragment is immutable
    And the first fragment only has a 'Relation' to the middle fragment
    And the middle fragment is immutable
    And the middle fragment only has a 'Relation' to the first and last fragments
    And the last fragment is not immutable
    And the last fragment only has a 'Relation' to the middle fragment
```

### Test Setup
For all these scenarios we use a [custom context](./docker-compose.yml) derived from the [Simulator / Workflow / Server / Mongo](../../../support/context/simulator-workflow-server-mongo/README.md) context. If needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Then you can run the systems by executing the following command:
```bash
docker compose up -d
```
> **Note**: it may take a minute for all the servers to start.

Browse to the [Apache NiFi user interface](https://localhost:8443/nifi) and create a new process group based on the [ingest workflow](./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

### Test Execution
For testing the pagination we need to send the [alfa.jsonld](./data/alfa.jsonld), [beta.jsonld](./data/beta.jsonld) and [gamma.jsonld](./data/gamma.jsonld) files, resulting in 2 complete fragments with 300 members each and an incomplete/mutable one with the remaining 17 items.

1. Upload the `alfa.jsonld`, `beta.jsonld` and `gamma.jsonld` files to the [simulator](http://localhost:9011/) and alias the first fragment:
```bash
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/alfa.jsonld'
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/beta.jsonld'
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/gamma.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```
3. Start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow).
4. Request the collection http://localhost:8080/mobility-hindrances.
5. Follow the `tree:view` and then the `tree:node`.

This results in the first fragment. Check that the `Cache-Control` header contains `immutable`. Search for the `tree#relation`. Note the type is `Relation` and follow it to the next/middle fragment.

In the middle fragment check that the `Cache-Control` header is again `immutable`. Search for the `tree#relation`. Note there are now two relations, both of type `Relation` and they link to the first and last fragments. Follow the link to the next/last fragment.

In the last fragment check that the `Cache-Control` header does **not** contain `immutable`. Search for the `tree#relation` and note that the type is again `Relation` and that it links to the previous/middle fragment.

### Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems as described [here](../../../support/context/simulator-workflow-sink/README.md#stop-the-systems), i.e.:
```bash
docker compose down
```
