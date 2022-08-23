# GTFS2LDES-js / Workflow / Server / Mongo Context
This context is used for validating the LDES server for the GTFS use case.

This context is based on a [GTFS to LDES convertor (JavaScript variant)](https://github.com/julianrojas87/gtfs2ldes-js) which produces a data set of connections as linked data (LD) objects starting from a GTFS data set and from the GTFS real-time (GTFS/RT) updates.

We use an Apache NiFi instance which should be configured with a workflow containing a standard ListenHTTP processor to listen to the generated LD objects being POSTed and forward these via a queue to a standard InvokeHTTP processor to the LDES server, which stores the data set in a MongoDB.

If required, the workflow can contain other processors to transfor the LD object as needed. Alternatively, custom processors can also be provided to listen to the GTFS2LDES system and/or POST to the LDES server.

## Setup the Context
To setup the context, combine the contents of all the `env.<component>` files into an `env.user` and specify the missing, required arguments:
* GTFS2LDES_TAG (e.g. `20220714t1136`)
* SINGLE_USER_CREDENTIALS_USERNAME (Apache NiFi single user credentials - user name)
* SINGLE_USER_CREDENTIALS_PASSWORD (Apache NiFi single user credentials - password)
* LDES_SERVER_TAG (e.g. `20220727t1517`)
* LDES_COLLECTIONNAME (e.g. `"connections"`)
* LDES_MEMBERTYPE (e.g. `"http://semweb.mmlab.be/ns/linkedconnections#Connection"`)

> **Note**: you need to specify a [Github personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) (PAT) with scope `read:packages`

Optionally, you can also specify different (external) port numbers for the components and other overridable variables:
* NIFI_UI_PORT (default: `8443`)
* NIFI_WORKFLOW_LISTEN_PORT (port the ListenHTTP processor listens for GTFS members, default: `9005`)
* NIFI_JVM_HEAP_INIT (initial JVM heap size, default: `8g`)
* NIFI_JVM_HEAP_MAX (max JVM heap size, default: `8g`)
* LDES_SHAPE (shape of ingested members, no default)
* VIEW_TIMESTAMPPATH (e.g. `"http://www.w3.org/ns/prov#generatedAtTime"`)
* VIEW_VERSIONOFPATH (e;g. `"http://purl.org/dc/terms/isVersionOf"`)
* TIMEBASED_MEMBERLIMIT (number of members per fragment, default: `100`)
* MONGODB_TAG (default: `5.0.11`)
* MONGODB_PORT (default: `27017`)

In addition, for the GTFS to LDES conversion, various other arguments are required (for more information see [here](https://github.com/julianrojas87/gtfs2ldes-js)):
* RUN_ON_LAUNCH (`true` or `false`, default: `true`)
* THROTTLE_RATE (default: 10)
* GTFS2LDES_DATA_FOLDER (location of GTFS data permanent storage, no default)
* GTFS_SOURCE (static GTFS file container path or URL, no default)
* GTFS_CRON (cron for reading GTFS source, default: `0 0 3 * * *`)
* GTFSRT_SOURCE (GTFS/RT URL, no default)
* GTFSRT_CRON (cron for reading GTFS/RT source, default: `*/30 * * * * *`)
* AUTH_HEADER (authentication type for requesting GTFS/RT, no default)
* AUTH_HEADER_VALUE (authentication value for requesting GTFS/RT, no default)

## Run the Systems
To create and start all systems in the context:
```bash
docker compose --env-file env.user up
```

> **Note**: the GTFS to LDES convertor starts immediately and currently we cannot automatically upload the workflow to the Apache NiFi system. Therefore, you need to stop the GTFS to LDES convertor, manually load the workflow, start the workflow and then re-start the GTFS to LDES convertor.

### Stop the GTFS to LDES convertor
To stop the GTFS to LDES convertor use the following Bash command:
```bash
docker stop gtfs2ldes-js
```

### Start the GTFS to LDES convertor
To stop the GTFS to LDES convertor use the following Bash command:
```bash
docker start gtfs2ldes-js
```

## Verify Context
To verify that all systems in the context are available (please subsitute the correct ports if changed):

### GTFS to LDES convertor
Please check the Docker logs for the status.

### LDES Client Workflow
The Apache NiFi server needs a couple of minutes to start. Use your favorite browser to connect to the Apache NiFi User Interface at https://localhost:8443/nifi/login and use your credentials to login.

### LDES Server
Browse to `http://localhost:8080/<ldes-collection-name>` (e.g. http://localhost:8080/connections) or run an equivalent Bash command, e.g.:
```bash
curl http://localhost:8080/connections
```

### Mongo Database
Browse to http://localhost:27017 or use Bash command:
```bash
curl http://localhost:27017
```
response:
```text
It looks like you are trying to access MongoDB over HTTP on the native driver port.
```
This means that the MongoDB is correctly started. To actually view the contents of the database, use a Mongo command line tool or GUI, e.g. [Compass](https://www.mongodb.com/products/compass).
![compass](./artwork/mongo-compass.png)

### Stop the Systems
To stop all systems in the context:
```bash
docker compose down
```
This will gracefully shutdown all systems in the context and remove them.

## C4 Diagrams

### Context
![context](./artwork/gtfs-demo.context.png)

### Container
![container](./artwork/gtfs-demo.container.png)

### Component
![component](./artwork/gtfs-demo.component.png)
