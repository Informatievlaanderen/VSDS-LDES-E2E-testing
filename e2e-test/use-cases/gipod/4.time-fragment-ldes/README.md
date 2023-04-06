# LDES Server Can Time-fragment an LDES
This test validates user story **As a data intermediary I want to request the fragmented GIPOD LDES data set.** (VSDSPUB-62) and was shown during demo 1 on July, 5th 2022.

The test verifies that the LDES Server can time-fragment an LDES. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and the LDES Server backed by a data store (mongodb).

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
    Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Started Application in`:
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

4. Verify the LDES is correctly time-fragmented

    Follow the `tree:view` and then the `tree:node`.

    This results in the first fragment, validate the `Cache-Control` header (`immutable`), search for the `tree#relation`, note the `GreaterThanOrEqualToRelation` (**no** `LesserThanOrEqualToRelation`) and follow it to the next/middle fragment.

    In this fragment validate the `Cache-Control` header (`immutable`), search for the `tree#relation`, note both the `LesserThanOrEqualToRelation` and `GreaterThanOrEqualToRelation` and follow the latter to the next/last fragment.

    In this fragment validate the `Cache-Control` header (**not** `immutable`), search for the `tree#relation`, note the `LesserThanOrEqualToRelation` (**no** `GreaterThanOrEqualToRelation`) and follow it to the previous/middle fragment.

    In this fragment  search for the `tree#relation`, note the `LesserThanOrEqualToRelation` and follow it to the previous/first fragment.

## Test Teardown
To stop all systems use:
```bash
docker compose stop ldio-workflow
docker compose --profile delay-started down
```
