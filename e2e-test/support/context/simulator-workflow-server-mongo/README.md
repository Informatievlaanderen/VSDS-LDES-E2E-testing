# Simulator / workflow / server / mongo context
This context is used for validating the LDES server.

We use an [LDES server simulator](/ldes-server-simulator/README.md) which serves (a subset of) a data set (e.g. alternative for GIPOD LDES server which contains too much data), an Apache NiFi instance containing the LDES client NiFi processor and the LDES server configured to capture the LDES members emitted by the LDES client NiFi processor.

## Setup the context
To setup the context, combine the contents of all the `env.<component>` files into an `env.user` and specify the missing, required arguments:
* LDES_SERVER_SIMULATOR_TAG (e.g. 20220718T1542)
* PAT_READ_PACKAGES (Github personal access token)
* LDES_CLIENT_NAR_TAG (e.g. 20220704.153332-11)
* SINGLE_USER_CREDENTIALS_USERNAME (Apache NiFi single user credentials - user name)
* SINGLE_USER_CREDENTIALS_PASSWORD (Apache NiFi single user credentials - password)
* LDES_SERVER_TAG (e.g. 20220721t0939)
* LDES_COLLECTIONNAME (e.g. `"mobility-hindrances"`)
* LDES_MEMBERTYPE (e.g. `"https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder"`)

> **Note**: you need to specify a [Github personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) (PAT) with scope `read:packages`

Optionally, you can also specify different (external) port numbers for the components and other overridable variables:
* LDES_SERVER_SIMULATOR_PORT (default: 9011)
* NIFI_UI_PORT (default: 8443)
* LDES_SERVER_SIMULATOR_SEED_FOLDER (an empty data folder, so no seeding)
* LDES_SHAPE (shape of ingested members, no default)
* VIEW_TIMESTAMPPATH (e.g. `"http://www.w3.org/ns/prov#generatedAtTime"`)
* VIEW_VERSIONOFPATH (e;g. `"http://purl.org/dc/terms/isVersionOf"`)
* TIMEBASED_MEMBERLIMIT (number of members per fragment, default: 100)
* MONGODB_TAG (default: 5.0.9)
* MONGODB_PORT (default: 27017)

## Run the systems
To create and start all systems in the context:
```bash
docker compose --env-file env.user up
```

## Verify context
To verify that all systems in the context are available (please subsitute the correct ports if changed):

### LDES server simulator
Browse to http://localhost:9011 or run bash command:
```bash
curl http://localhost:9011
```
response (if not seeded):
```json
{"aliases":[],"fragments":[]}
```

### LDES client workflow
The Apache NiFi server needs a couple of minutes to start. Use your favorite browser to connect to the Apache NiFi User Interface at https://localhost:8443/nifi/login and use your credentials to login.

### LDES server
Browse to `http://localhost:8080/<ldes-collection-name>` (e.g. http://localhost:8080/mobility-hindrances) or run an equivalent bash command, e.g.:
```bash
curl http://localhost:8080/mobility-hindrances
```
response will be similar to:
```json
{
  "@id": "http://ldes-server:8080/mobility-hindrances",
  "@type": "https://w3id.org/ldes#EventStream",
  "https://w3id.org/ldes#timestampPath": {
    "@id": "http://www.w3.org/ns/prov#generatedAtTime"
  },
  "https://w3id.org/ldes#versionOf": {
    "@id": "http://purl.org/dc/terms/isVersionOf"
  },
  "https://w3id.org/tree#shape": {
    "@id": "https://private-api.gipod.test-vlaanderen.be/api/v1/ldes/mobility-hindrances/shape"
  }
}
```

### Mongo database
Browse to http://localhost:27017 or use bash command:
```bash
curl http://localhost:27017
```
response:
```text
It looks like you are trying to access MongoDB over HTTP on the native driver port.
```
This means that the MongoDB is correctly started. To actually view the contents of the database, use a Mongo command line tool or GUI, e.g. [Compass](https://www.mongodb.com/products/compass).
![compass](./artwork/mongo-compass.png)

### Stop the systems
To stop all systems in the context:
```bash
docker compose down
```
This will gracefully shutdown all systems in the context and remove them.

## C4 diagrams

### Context
![context](./artwork/demo-ldes-server.context.png)

### Container
![container](./artwork/demo-ldes-server.container.png)

### Component
![component](./artwork/demo-ldes-server.component.png)
