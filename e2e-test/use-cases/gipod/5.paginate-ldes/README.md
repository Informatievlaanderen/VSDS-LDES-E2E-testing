# LDES Server Can Fragment an LDES Using Simple Pagination
This test validates user story **Server -> Develop pagination** (VSDSPUB-423) and was shown during demo on February, 14th 2023.

The test verifies that the LDES Server can paginate an LDES. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and the LDES Server backed by a data store (mongodb).

For this test we use a data set containing three fragments:
* `alfa.jsonld` (250 items)
* `beta.jsonld` (250 items)
* `epsilon.jsonld` (117 items)

So, the total data set contains 617 items. The LDES server is configured to create fragments of 300 members resulting in two fragments with 300 members each and an incomplete/mutable one with the remaining 17 items.

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

1. Run all systems except the workflow by executing the following (bash) command:
    ```bash
    docker compose up -d
    ```
    Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Mongock has finished`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
    ```
    Press `CTRL-C` to stop following the log.

2. Seed the data set to the [simulator](http://localhost:9011/) and [alias it](./create-alias.json):
    ```bash
    curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/alfa.jsonld'
    curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/beta.jsonld'
    curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/epsilon.jsonld'
    curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@data/create-alias.json'
    ```

## Test Execution
1. Start the workflow containing the LDES Client
    ```bash
    docker compose up ldio-workflow -d
    ```

2. Verify all (617) LDES members are ingested (execute repeatedly):
    ```bash
    curl http://localhost:9019/gipod/ldesmember
    ```

3. Request the collection 
    ```bash
    curl http://localhost:8080/mobility-hindrances
    ```

4. Verify the LDES is correctly paginated

    The `ldes:EventStream` has a property `tree:view` referring to the view having a `tree:relation` property containing one relation, which contains a `tree:node` referring to the the first fragment. Retrieve it and check that the `Cache-Control` header contains `immutable`. Search for the `tree#relation`. Note the type is `Relation` and follow it to the next/middle fragment.

    In the middle fragment check that the `Cache-Control` header is again `immutable`. Search for the `tree#relation`. Note there are now two relations, both of type `Relation` and they link to the first and last fragments. Follow the link to the next/last fragment.

    In the last fragment check that the `Cache-Control` header does **not** contain `immutable`. Search for the `tree#relation` and note that the type is again `Relation` and that it links to the previous/middle fragment.

## Test Teardown
To stop all systems use:
```bash
docker compose stop ldio-workflow
docker compose --profile delay-started down
```
