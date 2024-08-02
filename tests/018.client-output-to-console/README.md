# LDES Client Command Line Interface (CLI) can Replicate and Synchronize an LDES
To ease the verification of the LDES Client's behavior we have created a CLI wrapper for it.

The test verifies that the LDES Client can replicate and synchronize an LDES. It uses a context containing a (LDES Server) simulator serving the fragments and a workflow containing the LDES Client and a console out, which effectively creates a LDES client wrapper.

We do not seed the LDES Server Simulator because we need to upload a mutable fragment for the replication part (`gamma.ttl` = 1 item) and then update the fragment (`delta.ttl` = 50 items, i.e. adds 49 new members to `gamma.ttl`) for the synchronization part.

The LDES Client CLI starts to follow the given data set url as soons as it starts. It requests the existing data set by getting the first fragment and following all relations contained in the fragment. All fragments marked as immutable are retrieved only once. All mutable fragments are re-requested based on the fragment expiration date.

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

To run all systems and ingest the [data set](./data/gamma.ttl) and [alias it](./data/create-alias.json) execute the following (bash) command:
```bash
clear
sh ./setup.sh
```

## Test Execution
1. Start the workflow containing the LDES Client:
    ```bash
    curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"
    ```

2. Verify replication
    
    Check that exactly one member is output to the log:
    ```bash
    COUNT=0 && while [ "$COUNT" -ne "1" ] ; do sleep 3; COUNT=$(docker logs $(docker ps -q --filter "name=ldio-workbench$") | grep "http://purl.org/dc/terms/isVersionOf" | wc -l) ; echo "count: $COUNT" ; done
    ```
    As we have specified a freshness of 10 seconds the LDES Client CLI will re-request the fragment every 10 seconds. You can verify this by waiting a while and then querying the LDES Server Simulator (see the data under `responses`):
    ```bash
    curl http://localhost:9011/
    ```

3. Ingest the [data set update](./data/delta.ttl) containing the additional members:
    ```bash
    curl -X POST http://localhost:9011/ldes -H 'Content-Type: text/turtle' -d '@data/delta.ttl'
    ```

4. Verify Synchronization

    Check that exactly one member is output to the log:
    ```bash
    COUNT=0 && while [ "$COUNT" -ne "50" ] ; do sleep 3; COUNT=$(docker logs $(docker ps -q --filter "name=ldio-workbench$") | grep "http://purl.org/dc/terms/isVersionOf" | wc -l) ; echo "count: $COUNT" ; done
    ```
    Again, wait a while and request the LDES Server Simulator home page (http://localhost:9011/) and ensure that the repeated re-requesting has ended.

## Test Teardown
To stop all systems use:
```bash
sh ./teardown.sh
```
