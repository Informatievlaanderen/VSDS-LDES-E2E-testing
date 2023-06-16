# LDES Server Can Fragment an LDES Using Simple Pagination
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
    Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Cancelled mongock lock daemon`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
    ```
    Press `CTRL-C` to stop following the log.

    > **Note**: as of server v1.0 which uses dynamic configuration you need to execute the [seed script](./config/seed.sh) to setup the LDES with its views:
    ```
    chmod +x ./config/seed.sh
    sh ./config/seed.sh
    ```

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
    docker compose up ldio-workbench -d
    while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```
    or:
    ```bash
    docker compose up nifi-workbench -d
    while ! curl -s -I "http://localhost:8000/nifi/"; do sleep 5; done
    ```
    > **Note**: for the [NiFi workbench](http://localhost:8000/nifi/) you also need to upload the [workflow](./nifi-workflow.json) and start it

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
docker compose rm -s -f -v ldio-workbench
docker compose down
```
or:
```bash
docker compose rm -s -f -v nifi-workbench
docker compose down
```
