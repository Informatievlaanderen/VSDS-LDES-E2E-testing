# LDES Client Command Line Interface (CLI) can Replicate and Synchronize an LDES
To ease the verification of the LDES Client's behavior we have created a CLI wrapper for it.

## Test Setup
To demonstrate the LDES Client CLI, we use the [Simulator](../../ldes-server-simulator/README.md) and the LDES Client CLI. Please copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the arguments as needed.

We do not seed the LDES Server Simulator because we need to upload a mutable fragment for the replication part (`gamma.jsonld` = 1 item) and then update the fragment (`delta.jsonld` = 50 items, i.e. adds 49 new members to `gamma.jsonld`) for the synchronization part.

The LDES Client CLI starts to follow the given data set url as soons as it starts. It requests the existing data set by getting the first fragment and following all relations contained in the fragment. All fragments marked as immutable are retrieved only once. All mutable fragments are re-requested based on the fragment expiration date.

Create both containers and run the simulator:
```bash
docker compose --env-file user.env create
docker compose --env-file user.env start ldes-server-simulator
```

## Test Execution and Verification
Ingest the [data set](./data/gamma.jsonld) and [alias it](./create-alias.json) - in a new terminal window (bash shell):
```bash
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/json-ld' -d '@data/gamma.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
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

### Verify Replication
When ready, you can launch the LDES Client CLI to start replicating and synchronizing with the LDES Server Simulator.
```bash
docker compose --env-file user.env start ldes-cli
```

Watch the LDES Client CLI retrieve and output exactly one member to the container log file by following the container logs (in another shell):
```bash
docker logs -f simulator-cli_ldes-client-cli
```

As we have specified a freshness of 10 seconds the LDES Client CLI will re-request the fragment every 10 seconds. You can verify this by waiting a while and then querying the LDES Server Simulator (see the data under `responses`):
```bash
curl http://localhost:9011/
```

### Verify Synchronization
Ingest the [data set update](./data/delta.jsonld) containing the additional members and see the LDES Client CLI output them as well:
```bash
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/json-ld' -d '@data/delta.jsonld'
```

Stop following the log file and output the log to a file:
```bash
docker logs simulator-cli_ldes-client-cli > ./fragment.nq
```

Verify the file contains exactly 50 members (e.g. count the number of `http://purl.org/dc/terms/isVersionOf` occurences).
```
cat ./fragment.nq | grep "http://purl.org/dc/terms/isVersionOf" | wc -l
```

Again, wait a while and request the LDES Server Simulator home page (http://localhost:9011/) and ensure that the repeated re-requesting has ended.

## Test Teardown
Stop all systems, i.e.:
```bash
docker compose --env-file user.env down
```
