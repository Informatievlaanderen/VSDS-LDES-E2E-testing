# LDES Client Can Synchronize an LDES
The test verifies that the LDES Client can synchronize a (small subset of the) Gent P+R data set, after replication. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and a message sink backed by a data store (mongodb).

For this test we use a data set containing three fragments in the initial set (for the replication part):
* `alfa.ttl` (250 items)
* `beta.ttl` (250 items)
* `gamma.ttl` (1 item)

In addition, we use two file that allow us to update the last fragment (synchronization):
* `delta.ttl` (50 items - adds 49 new members to `gamma.ttl`)
* `epsilon.ttl` (117 items - adds 67 new members to `delta.ttl`)

We need to upload all but the last fragment as an immutable fragment and the last fragment with a freshness indication of N seconds (see [max-age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#response_directives)). This will ensure that the LDEs client retrieves the first two fragments only once and the last one repeatedly, every N seconds.

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

1. Run all systems except the workflow by executing the following (bash) command:
    ```bash
    docker compose up -d
    ```

2. Seed the initial data set and [alias it](./create-alias.json)
    ```bash
    curl -X POST http://localhost:9011/ldes -H 'Content-Type: text/turtle' -d '@data/alfa.ttl'
    curl -X POST http://localhost:9011/ldes -H 'Content-Type: text/turtle' -d '@data/beta.ttl'
    curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: text/turtle' -d '@data/gamma.ttl'
    curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@data/create-alias.json'
    ```
    **Note** the `?max-age=10` part in the last command limiting the freshness to 10 seconds.

    The simulator (http://localhost:9011) will respond with:
    ```json
   {"content-type":"text/turtle","cache-control":"public, max-age=604800, immutable","id":"/ldes/occupancy/by-page?pageNumber=1"}
   {"content-type":"text/turtle","cache-control":"public, max-age=604800, immutable","id":"/ldes/occupancy/by-page?pageNumber=2"}
   {"content-type":"text/turtle","cache-control":"public, max-age=10","id":"/ldes/occupancy/by-page?pageNumber=3"}
   {"from":"/ldes/occupancy","to":"/ldes/occupancy/by-page?pageNumber=1"}
    ```
    **Note** the `"cache-control":"public, max-age=604800, immutable"` for the first two fragments and the `"cache-control":"public, max-age=10"` for the last one.

3. Start the workflow containing the LDES Client
    ```bash
    docker compose up ldio-workbench -d
    while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```

4. Verify that all members are received by the [sink](http://localhost:9003/) (execute repeatedly):
    ```bash
    curl http://localhost:9003/
    ```
    **Note** that after a short while the result should be (alfa + beta + gamma):
    ```json
    {"count":501}
    ```

5. Verify that last fragment is re-requested on a regular interval (definied by the amount of seconds in the `?max-age=10` part when uploading it, i.e. every 10 seconds) but no members are sent to the sink HTTP server (execute repeatedly):
    ```bash
    curl http://localhost:9011/
    curl http://localhost:9003/
    ```

## Test Execution
This part verifies that the *synchronization* works after the initial data set is *replicated*.

1. Seed a data set update.
    ```bash
    curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: text/turtle' -d '@data/delta.ttl'
    ```

2. Verify update received (execute repeatedly):
    ```bash
    curl http://localhost:9003/
    ```
    **Note** that after a short while the result should be (alfa + beta + delta):
    ```json
    {"count":550}
    ```

3. Seed another data set update:
    ```bash
    curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: text/turtle' -d '@data/epsilon.ttl'
    ```

4. Verify that synchronization happens correctly (execute repeatedly):
    ```bash
    curl http://localhost:9003/
    ```
    **Note** that after a short while the result should be (alfa + beta + epsilon):
    ```json
    {"count":617}
    ```

## Test Teardown
To stop all systems use:
```bash
docker compose rm -s -f -v ldio-workbench
docker compose down
```
