# LDES Server Can Fragment an LDES Using Geospatial Fragmentation
The test verifies that the LDES Server can fragment an LDES using multiple levels (e.g. first geospatially and then time-based). It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and the LDES Server backed by a data store (mongodb).

The test data set consists of a single file containing [six member](./data/six-members.jsonld). This data set is used:
* to demonstrate the geospatial bucketizer's ability to correctly create (multiple) buckets for a given member based on the configured property,
* to verify that the generated buckets values (`ldes:bucket`) are not present in the generated fragments and
* to illustrate the current strategy used by the geospatial fragmentation to create fragments and the relations included.


## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the workflow by executing the following (bash) command:
```bash
docker compose up -d
```
Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Mongock has finished`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
    ```
Press `CTRL-C` to stop following the log.

## Test Execution
1. Ingest the data set ([single file containing six members](./data/six-members.jsonld)) and [alias it](./create-alias.json):
    ```bash
    curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/six-members.jsonld'
    curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@data/create-alias.json'
    ```

2. Start the workflow containing the LDES Client
    ```bash
    docker compose up ldio-workflow -d
    ```

3. Verify the LDES members are ingested (execute repeatedly until the `ldesmember` document collection contains 6 members):
    ```bash
    curl http://localhost:9019/gipod/ldesmember
    ```
    and the `ldesfragment` document collection contains the real root/redirection fragment, the geo-spatial root fragment 0/0/0, four tile fragments and eight timebased fragments because the fragment member count is configured to hold at most five members (i.e. expected total is 14 fragments):
    ```bash
    curl http://localhost:9019/gipod/ldesfragment
    ```

4. Verify the fragments:
    ```bash
    curl 'http://localhost:8080/mobility-hindrances/by-location-and-time?tile=0/0/0'
    ```
    We have configured the zoom level to 15, so that the geospatial fragmentation creates four tile fragments (15 / x / y)
    ```bash
    curl -s  'http://localhost:8080/mobility-hindrances/by-location-and-time?tile=0/0/0' | grep "tile=15/"
    ```
    returns:
    ```
    tree:node   <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16743/11010> ;
    tree:node   <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16743/11009> ;
    tree:node   <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16744/11009> ;
    tree:node   <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16742/11010> ;
    ```
    Each of these four tile fragments has one relation pointing to the first timebased fragment:
    ```bash
    curl -s 'http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16743/11010' | grep tree:node
    curl -s 'http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16744/11009' | grep tree:node
    curl -s 'http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16743/11009' | grep tree:node
    curl -s 'http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16742/11010' | grep tree:node
    ```
    returns (something similar to):
    ```
    tree:node  <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16743/11010&generatedAtTime=2023-04-03T11:13:07.088Z>
    tree:node  <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16744/11009&generatedAtTime=2023-04-03T11:13:07.059Z>
    tree:node  <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16743/11009&generatedAtTime=2023-04-03T11:13:07.060Z>
    tree:node  <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16742/11010&generatedAtTime=2023-04-03T11:13:07.059Z>
    ```
    Each of these four timebased fragments has one relation pointing to the second timebased fragment:
    ```bash
    curl -s 'http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16743/11010&generatedAtTime=2023-04-03T11:13:07.088Z' | grep tree:node
    curl -s 'http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16744/11009&generatedAtTime=2023-04-03T11:13:07.059Z' | grep tree:node
    curl -s 'http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16743/11009&generatedAtTime=2023-04-03T11:13:07.060Z' | grep tree:node
    curl -s 'http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16742/11010&generatedAtTime=2023-04-03T11:13:07.059Z' | grep tree:node
    ```
    returns (something similar to):
    ```
    tree:node   <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16743/11010&generatedAtTime=2023-04-03T11:13:07.414Z> ;
    tree:node   <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16744/11009&generatedAtTime=2023-04-03T11:13:07.392Z> ;
    tree:node   <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16743/11009&generatedAtTime=2023-04-03T11:13:07.395Z> ;
    tree:node   <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=15/16742/11010&generatedAtTime=2023-04-03T11:13:07.401Z> ;
    ```

## Try-out Different Fragmentation Strategies.
To try out a different fragmentation strategy you need to tune the [Docker Compose](./docker-compose.yml) file and follow these steps:
1. Change the strategy, e.g.:
   * Disable the current strategy (comment) and enable (uncomment) the `ALTERNATIVE STRATEGY: only timebased`
   * Disable the current strategy (comment) and enable (uncomment) the `ALTERNATIVE STRATEGY: only geospatial`
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
    docker compose stop ldio-workflow
    docker compose rm -v -f ldio-workflow
    docker compose up ldio-workflow -d   
    ```

## Test Teardown
To stop all systems use:
```bash
docker compose stop ldio-workflow
docker compose --profile delay-started down
```
