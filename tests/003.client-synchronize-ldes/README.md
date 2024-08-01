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

To run all systems, seed the initial data set and [alias it](./create-alias.json), start the workflow containing the LDES Client and verify that all (501) members are received (replicated) by the [sink](http://localhost:9003/) execute the following (bash) command:
```bash
clear
sh ./setup.sh
```

## Test Execution
This part verifies that the *synchronization* works after the initial data set is *replicated*.

1. Seed a data set update.
    ```bash
    curl -X POST "http://localhost:9011/ldes?max-age=10" -H 'Content-Type: text/turtle' -d '@data/delta.ttl'
    ```

2. Verify update received (execute repeatedly):
    ```bash
    COUNT=0 && while [ "$COUNT" -ne "550" ] ; do sleep 3; COUNT=$(curl -s http://localhost:9003 | jq '.parkAndRide.total') ; echo "count: $COUNT" ; done
    ```
    **Note** that after a short while the result should be (alfa + beta + delta):
    ```json
    {"count":550}
    ```

3. Seed another data set update:
    ```bash
    curl -X POST "http://localhost:9011/ldes?max-age=10" -H 'Content-Type: text/turtle' -d '@data/epsilon.ttl'
    ```

4. Verify that synchronization happens correctly (execute repeatedly):
    ```bash
    COUNT=0 && while [ "$COUNT" -ne "617" ] ; do sleep 3; COUNT=$(curl -s http://localhost:9003 | jq '.parkAndRide.total') ; echo "count: $COUNT" ; done
    ```
    **Note** that after a short while the result should be (alfa + beta + epsilon):
    ```json
    {"count":617}
    ```

## Test Teardown
To stop all systems use:
```bash
sh ./teardown.sh
```
