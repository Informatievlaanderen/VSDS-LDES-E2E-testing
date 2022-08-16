# Simulator / Client CLI Context
This context is used for validating the LDES client CLI.

We use an [LDES Server Simulator](/ldes-server-simulator/README.md) which serves (a subset of) a data set (e.g. alternative for GIPOD LDES server which contains too much data) and the LDES Client CLI to replicate and synchronize the LDES members to the console.

## Setup the Context
To setup the context, combine the contents of all the `env.<component>` files into an `env.user` and specify the missing, required arguments:
* LDES_SERVER_SIMULATOR_TAG (e.g. 20220718T1542)
* LDES_CLIENT_CLI_TAG (e.g. 20220815T1443)
* LDES_DATA_SET_URL (e.g. "http://ldes-server-simulator:9011/my-data-set")

Optionally, you can also specify different (external) port numbers for the components and other overridable variables:
* LDES_SERVER_SIMULATOR_PORT (default: 9011)
* LDES_SERVER_SIMULATOR_SEED_FOLDER (local folder containing fragments to seed the simulator with, default: ../../data/empty)

## Run the Systems
To create all systems in the context:
```bash
docker compose --env-file env.user create
```

You can now start the LDES Server Simulator:
```bash
docker compose --env-file env.user start ldes-server-simulator
```

## Verify Context
To verify that the LDES Server Simulator is available (please subsitute the correct ports if changed):

Browse to http://localhost:9011 or run Bash command:
```bash
curl http://localhost:9011
```
response (if not seeded) looks like:
```json
{"aliases":[],"fragments":[]}
```

If you have not seeded the LDES Server Simulator, you can now upload fragments, make aliases, etc. E.g.:
```bash
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/json-ld' -d '@data/my-data-set.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '{"original":"http://ldes-server-simulator:9011/my-data-set/first-fragment", "alias":"http://ldes-server-simulator:9011/my-data-set"}'
```

## Start the LDES Client CLI
When ready, you can launch the LDES Client CLI to start replicating and synchronizing with the LDES Server Simulator.
```bash
export LDES_DATA_SET_URL="http://ldes-server-simulator:9011/my-data-set"
docker compose --env-file env.user start ldes-client-cli
```

## Stop the Systems
To stop all systems in the context:
```bash
docker compose down
```
This will gracefully shutdown all systems in the context and remove them.

## C4 Diagrams

### Context
![context](./artwork/demo-ldes-client-cli.context.png)

### Container
![container](./artwork/demo-ldes-client-cli.container.png)

### Component
![component](./artwork/demo-ldes-client-cli.component.png)
