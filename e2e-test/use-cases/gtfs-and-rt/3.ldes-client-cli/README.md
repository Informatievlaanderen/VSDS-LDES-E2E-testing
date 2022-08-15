# LDES Client Command Line Interface (CLI) can Replicate and Synchronize an LDES
To ease the verification of the LDES Client's behavior we have created a CLI wrapper for it.

### Test Setup
To demonstrate the LDES Client CLI, we again use the [Simulator / Workflow / Server / Mongo](../../../support/context/simulator-workflow-server-mongo/README.md) context. Please copy the [environment file (env.client-cli)](./env.client-cli) to a personal file (e.g. `env.user`) and fill in the following mandatory arguments:
* PAT_READ_PACKAGES
* SINGLE_USER_CREDENTIALS_USERNAME
* SINGLE_USER_CREDENTIALS_PASSWORD

> **`TODO`** tune the zoom level so the GIPOD hidrance spans more than one tile

This time we do not seed the LDES Server Simulator because we need to upload a mutable fragment for the replication part (`gamma.jsonld` = 1 item) and then update the fragment (`delta.jsonld` = 50 items, i.e. adds 49 new members to `gamma.jsonld`) for the synchronization part.

> **`TODO`** describe the LDES Client CLI

### Test Execution
> **`TODO`** visualize the hindrance (extract hindrance wkt, paste to file, use converter, plot on wkt playground)

Set the docker compose file location:
```bash
export COMPOSE_FILE="../../../support/context/simulator-workflow-server-mongo/docker-compose.yml"
export LDES_SERVER_SIMULATOR_SEED_FOLDER=$(pwd)/../../../support/data/empty
```

Run the systems:
```bash
docker compose --env-file env.user up
```

Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file and create a new process group based on the [ingest workflow](./nifi-workflow.json) as specified in [here](../../../support/workflow/README.md#creating-a-workflow).

Ingest the [data set](./data/gamma.jsonld) and [alias it](./create-alias.json):
```bash
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/json-ld' -d '@data/gamma.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```

> **`TODO`** start the LDES Client CLI

Start the workflow as described [here](../../../support/workflow/README.md#starting-a-workflow).

> **`TODO`** describe the LDES Client CLI verification, i.e. watch the LDES Client CLI receive and output the first member (the fragments all contain the one member) ONCE to the console

> **`TODO`** restart the LDES Client CLI and capture to file

> **`TODO`** upload the delta.jsonld containing the additional members and see the LDES Client CLI output them all to the file

> **`TODO`** verify the file online to contain exactly 50 members

### Test Teardown
First stop the workflow as described [here](../../../support/workflow/README.md#stopping-a-workflow) and then stop all systems, i.e.:
```bash
docker compose --env-file env.user down
```
