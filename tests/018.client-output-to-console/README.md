# LDES Client Command Line Interface (CLI) can Replicate and Synchronize an LDES
To ease the verification of the LDES Client's behavior we have created a CLI wrapper for it.

The test verifies that the LDES Client can replicate and synchronize an LDES. It uses a context containing a (LDES Server) simulator serving the fragments and a workflow containing the LDES Client and a console out, which effectively creates a LDES client wrapper.

We do not seed the LDES Server Simulator because we need to upload a mutable fragment for the replication part (`gamma.jsonld` = 1 item) and then update the fragment (`delta.jsonld` = 50 items, i.e. adds 49 new members to `gamma.jsonld`) for the synchronization part.

The LDES Client CLI starts to follow the given data set url as soons as it starts. It requests the existing data set by getting the first fragment and following all relations contained in the fragment. All fragments marked as immutable are retrieved only once. All mutable fragments are re-requested based on the fragment expiration date.

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

1.  Run all systems except the workflow by executing the following (bash) command:
    ```bash
    docker compose up -d
    ```

2. Ingest the [data set](./data/gamma.jsonld) and [alias it](./data/create-alias.json) - in a new terminal window (bash shell):
    ```bash
    curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/ld+json' -d '@data/gamma.jsonld'
    curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@data/create-alias.json'
    ```
    > **Note**: that we specified `?max-age=10` to indicate that the fragment is mutable with a freshness of 10 seconds.

    You can verify that the LDES Server Simulator now contains a single fragment (containing one member - see http://localhost:9011/api/v1/ldes/mobility-hindrances):
    ```bash
    curl http://localhost:9011/
    ```
    returns:
    ```json
    {
        "aliases":["/api/v1/ldes/mobility-hindrances"],
        "fragments":["/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-06-03T07:58:29.2Z"],
        "responses":{}
    }
    ```

## Test Execution
1. Start the workflow containing the LDES Client:
    ```bash
    docker compose up ldio-workbench -d
    while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```

2. Verify replication
    
    Check that exactly one member is output to the log:
    ```bash
    docker logs $(docker ps -q --filter "name=ldio-workbench$") | grep "http://purl.org/dc/terms/isVersionOf" | wc -l
    ```
    As we have specified a freshness of 10 seconds the LDES Client CLI will re-request the fragment every 10 seconds. You can verify this by waiting a while and then querying the LDES Server Simulator (see the data under `responses`):
    ```bash
    curl http://localhost:9011/
    ```


3. Ingest the [data set update](./data/delta.jsonld) containing the additional members:
    ```bash
    curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/delta.jsonld'
    ```

4. Verify Synchronization

    Check that exactly one member is output to the log:
    ```bash
    docker logs $(docker ps -q --filter "name=ldio-workbench$") | grep "http://purl.org/dc/terms/isVersionOf" | wc -l
    ```
    Again, wait a while and request the LDES Server Simulator home page (http://localhost:9011/) and ensure that the repeated re-requesting has ended.

## Test Teardown
To stop all systems use:
```bash
docker compose stop ldio-workbench
docker compose --profile delay-started down
```
