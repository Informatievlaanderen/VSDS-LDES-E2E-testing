# LDES Server Performance is Adequate for GTFS/RT Processing
This test verifies that the LDES server can keep up with the stream of linked connections from the GTFS to the LDES converter. It uses a context containing a [GTFS to LDES convertor (JavaScript variant)](https://github.com/julianrojas87/gtfs2ldes-js) generating GTFS and GTFS/RT linked connections (version objects) directly connected to the LDES Server backed by a data store (mongodb).

The throttle rate `(THROTTLE_RATE)` and the fragment member limit `(VIEWS_0_FRAGMENTATIONS_1_CONFIG_MEMBERLIMIT)` are set to the same value (100), so for every batch of linked connections being ingested, the LDES server creates one fragment.

We use the RTD (Regional Transportation District) Denver [bus schedule](https://www.rtd-denver.com/files/gtfs/bustang-co-us.zip) as a data set which contains about 79000 linked connections in the base schedule. Once this schedule is processed, the GTFS/RT (real-time) updates are received and processed.

## Test Setup
1. Run all systems except the GTFS to LDES convertor and the LDES list fragments tool by executing the following (bash) command:
```bash
docker compose up -d
```
> **Notes**:
> * if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.
> * in the [data folder](./data/) you can find additional GTFS/RT source to test with (e.g. [De Lijn](./data/delijn.env) & [NMBS/SNCB](./data/nmbs.env))
> * for the [GTFS(RT) data from De Lijn](https://data.delijn.be/) you will need to request a subcription and then you will receive an API (authentication) key which is required to receive the realtime changes.
> * the GTFS2LDES service is assigned to an arbitrary profile named `delay-started` to prevent it from starting immediately.

Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Started Application in`:
```bash
docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
```
Press `CTRL-C` to stop following the log.

## Test Execution
1. Start the GTFS to LDES convertor:
    ```bash
    docker compose up gtfs2ldes-js -d
    ```
    and verify that the GTFS to LDES convertor is processing the GTFS or GTFS/RT source  by following the container log until you see the following message `Posted 100 Connection updates so far...`:
    ```bash
    docker logs --tail 1000 -f $(docker ps -q --filter "name=gtfs2ldes-js$")
    ```
    Press `CTRL-C` to stop following the log.

2. Verify LDES members are being ingested (execute in new terminal - infinite loop):
    ```bash
    while :; do curl http://localhost:9019/bustang/ldesmember; echo ''; sleep 0.5; done
    ```
    and fragments are being created (execute in new terminal - infinite loop):
    ```bash
    while :; do curl http://localhost:9019/bustang/ldesfragment; echo ''; sleep 0.5; done
    ```

3. Optionally, verify which fragments are being created using the [LDES list fragments](/ldes-list-fragments/README.md) tool:
    ```bash
    docker compose up ldes-list-fragments
    ```

4. Stop following LDES member count, LDES fragment count and LDES fragment URIs

## Test Teardown
To stop all systems use:
```bash
docker compose stop ldes-list-fragments
docker compose stop gtfs2ldes-js
docker compose --profile delay-started down
```
