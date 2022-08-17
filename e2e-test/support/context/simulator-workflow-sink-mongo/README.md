# Simulator / Workflow / Sink Context
This context is used for validating the LDES client.

We use an [LDES Server Simulator](/ldes-server-simulator/README.md) which serves (a subset of) a data set (e.g. alternative for GIPOD LDES server which contains too much data), an Apache NiFi instance containing the LDES client NiFi processor and, a small HTTP server which serves as a [sink](/ldes-client-sink/README.md) that allows to capture the LDES members emitted by the LDES client NiFi processor.

## Setup the Context
To setup the context, combine the contents of all the `env.<component>` files into an `env.user` and specify the missing, required arguments:
* LDES_SERVER_SIMULATOR_TAG (e.g. 20220718T1542)
* PAT_READ_PACKAGES (Github personal access token)
* LDES_CLIENT_NAR_TAG (e.g. 20220704.153332-11)
* SINGLE_USER_CREDENTIALS_USERNAME (Apache NiFi single user credentials - user name)
* SINGLE_USER_CREDENTIALS_PASSWORD (Apache NiFi single user credentials - password)
* LDES_CLIENT_SINK_TAG (e.g. 20220714T1423)

> **Note**: you need to specify a [Github personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) (PAT) with scope `read:packages`

Optionally, you can also specify different (external) port numbers for the components and other overridable variables:
* USECASE_NAME (default: `simulator-workflow-sink`)
* LDES_SERVER_SIMULATOR_PORT (default: 9011)
* LDES_CLIENT_SINK_PORT (default: 9003)
* NIFI_UI_PORT (default: 8443)
* LDES_SERVER_SIMULATOR_SEED_FOLDER (an empty data folder, so no seeding)

## Run the Systems
To create and start all systems in the context:
```bash
docker compose --env-file env.user up
```

## Verify Context
To verify that all systems in the context are available (please subsitute the correct ports if changed):

### LDES Server Simulator
Browse to http://localhost:9011 or run Bash command:
```bash
curl http://localhost:9011
```
response (if not seeded):
```json
{"aliases":[],"fragments":[]}
```

### LDES Client Workflow
The Apache NiFi server needs a couple of minutes to start. Use your favorite browser to connect to the Apache NiFi User Interface at https://localhost:8443/nifi/login and use your credentials to login.

### LDES Client Sink
Browse to http://localhost:9003 or run Bash command:
```bash
curl http://localhost:9003
```
response:
```json
{"count":0}
```

### Stop the Systems
To stop all systems in the context:
```bash
docker compose --env-file env.user down
```
This will gracefully shutdown all systems in the context and remove them.

## C4 Diagrams

### Context
![context](./artwork/demo-ldes-client.context.png)

### Container
![container](./artwork/demo-ldes-client.container.png)

### Component
![component](./artwork/demo-ldes-client.component.png)
