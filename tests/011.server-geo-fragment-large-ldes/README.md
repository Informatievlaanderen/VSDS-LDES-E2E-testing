# LDES Server Offers a Geospatial View on GTFS/RT (e.g. De Lijn)
This scenario verifies that the LDES server can geo-spatially fragment GTFS. It uses a context containing a [GTFS to LDES convertor (JavaScript variant)](https://github.com/julianrojas87/gtfs2ldes-js) generating GTFS and GTFS/RT linked connections (version objects), a workflow (for buffering) containing a http listener and a http sender and the LDES Server backed by a data store (mongodb).

Because the LDES server is configured to fragment the members geospatially and then by time, the structure created is a geospatial (search) tree with three levels: the root tile node, the tile nodes at the specified level (e.g. level 15) and the linked list of timebased fragments below these non-root tile nodes. The tile nodes only contain relations, while the timebased fragments each contain a maximum number (e.g. 100) of members and a link to the next (newer) fragment.

## Test Setup
1. Run all systems except the GTFS to LDES convertor by executing the following (bash) command:
```bash
docker compose up -d
```
> **Notes**:
> * if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.
> * in the [data folder](./data/) you can find additional GTFS/RT source to test with (e.g. [De Lijn](./data/delijn.env) & [NMBS/SNCB](./data/nmbs.env))
> * for the [GTFS(RT) data from De Lijn](https://data.delijn.be/) you will need to request a subcription and then you will receive an API (authentication) key which is required to receive the realtime changes.
> * the GTFS2LDES service is assigned to an arbitrary profile named `delay-started` to prevent it from starting immediately.

Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Cancelled mongock lock daemon`:
```bash
docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
```
Press `CTRL-C` to stop following the log.

## Test Execution
1. Start the workbench:
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

2. Start the GTFS to LDES convertor:
    ```bash
    docker compose up gtfs2ldes-js -d
    ```
    and verify that the GTFS to LDES convertor is processing the GTFS or GTFS/RT source  by following the container log until you see the following message `Posted 100 Connection updates so far...`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=gtfs2ldes-js$")
    ```
    Press `CTRL-C` to stop following the log.

3. Verify LDES Members are being ingested (execute repeatedly until at least one member):
    ```bash
    curl http://localhost:9019/bustang/ldesmember
    ```
    and fragments are being created (execute repeatedly until more than three fragments exists):
    ```bash
    curl http://localhost:9019/bustang/ldesfragment
    ```

4. Verify the geo-spatial fragmentation by requesting the view's root fragment:
    ```bash
    curl 'http://localhost:8080/connections/by-location-and-time?tile=0/0/0'
    ```

## Test Teardown
To stop all systems use:
```bash
docker compose rm -s -f -v gtfs2ldes-js
docker compose rm -s -f -v ldio-workbench
docker compose down
```
or:
```bash
docker compose rm -s -f -v gtfs2ldes-js
docker compose rm -s -f -v nifi-workbench
docker compose down
```
