# LDES Server Offers Multiple Views
The test verifies that the LDES Server can fragment an LDES using multiple views (e.g. geospatially fragmented, pagination only, etc.). It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and the LDES Server backed by a data store (mongodb).

The test data set consists of a single file containing [six member](./data/six-members.jsonld). This data set is used:
* to demonstrate the geospatial bucketizer's ability to correctly create (multiple) buckets for a given member based on the configured property,
* to verify that the generated buckets values (`ldes:bucket`) are not present in the generated fragments and
* to illustrate the current strategy used by the geospatial fragmentation to create fragments and the relations included.

> **Notes**:
>
> The **LDES Server** provides some configuration to cover the following acceptance criteria:
> * can configure LDES server to with multiple views
> * each view of the LDES server consists of a name and a list of fragmentations. Each fragmentation consists of the name of that fragmentation (pagination/geospatial) and a set of configuration parameters
> * members are ingested via endpoint '/{collectionname}' and saved once in the storage provider
> * views are consulted via the endpoint '/{collectionname}/{viewname}'

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the workflow by executing the following (bash) command:
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

## Test Execution
1. Ingest the data set ([single file containing six members](./data/six-members.jsonld)) and [alias it](./create-alias.json):
    ```bash
    curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/six-members.jsonld'
    curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@data/create-alias.json'
    ```

2. Start the workflow containing the LDES Client
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

3. Verify the LDES members are ingested (execute repeatedly until the `ldesmember` document collection contains 6 members):
    ```bash
    curl http://localhost:9019/gipod/ingest_ldesmember
    ```
    and the `ldesfragment` document collection contains 9 fragments (execute repeatedly):
    * the real root/redirection fragment, 
    * view 1:
      * the geo-spatial root fragment 0/0/0, 
      * four tile fragments
    * view 2:
      * the pagination root,
      * two paged fragments because the fragment member count is configured to hold at most 5 members 
    ```bash
    curl http://localhost:9019/gipod/fragmentation_fragment
    ```

## Try-out Different Fragmentation Strategies.
To try out a different fragmentation strategy you need to tune the [Docker Compose](./docker-compose.yml) file and follow these steps:
1. Updating the values of `VIEWS_X_NAME`, `VIEWS_X_FRAGMENTATIONS_Y_NAME` and `VIEWS_X_FRAGMENTATIONS_Y_CONFIG_` as needed (see [LDES Server configuration](https://github.com/Informatievlaanderen/VSDS-LDESServer4J#application-configuration) for more information):
    * `VIEWS_X_NAME`: view name
    * `VIEWS_X_FRAGMENTATIONS_Y_NAME`: fragmentation type
    * `VIEWS_X_FRAGMENTATIONS_Y_CONFIG_`: fragmentation type specific config
2. Delete the MongoDB database (e.g. using [Mongo Compass](https://www.mongodb.com/products/compass)):
    ```bash
    docker compose stop ldes-mongodb
    docker compose rm -v -f ldes-mongodb
    docker compose up ldes-mongodb -d   
    ``` 
3. Recreate the ldes-server:
    ```bash
    docker compose stop ldes-server
    docker compose rm -v -f ldes-server
    docker compose up ldes-server -d   
    ``` 
4. Re-create the workflow:
    ```bash
    docker compose stop ldio-workbench
    docker compose rm -v -f ldio-workbench
    docker compose up ldio-workbench -d   
    while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```

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

