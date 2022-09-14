# LDES Server Offers Multiple Views
This test validates user story **As a consumer I want multiple views so that I can different views on my data** and was shown during demo 1 on September, 13th 2022.

## LDES Server
The LDES Server provides some configuration to cover the following acceptance criteria:
* can configure LDES server to with multiple views
* each view of the LDES server consists of a name and a list of fragmentations. Each fragmentation consists of the name of that fragmentation (timebased/geospatial) and a set of configuration parameters
* members are ingested via endpoint '/{collectionname}' and saved once in the storage provider
* views are consulted via the endpoint '/{viewname}'

### Test Setup
To demonstrate the geospatial fragmentation, we use the [Simulator / Workflow / Server / Mongo](../../../support/context/simulator-workflow-server-mongo/README.md) context. Please copy the [environment file (env.multiview)](./env.multiview) to a personal file (e.g. `env.user`) and fill in the mandatory arguments. 

The environment file is already configured for two view (one geospatial & timebased and one timebased) but you can adapt the configuration settings as described [here](../../../support/context/simulator-workflow-server-mongo/README.md#multiview). 
Please note the specific configuration properties which allow to configure the amount of views and types of fragmentations (`X` represents the view number starting at 0, `Y` represents the fragmentation number starting at 0):
* VIEWS_X_NAME=name of the view
* VIEWS_X_FRAGMENTATIONS_Y_NAME=name of fragmentation (currently, only "timebased" and "geospatial" are supported)
* VIEWS_X_FRAGMENTATIONS_Y_CONFIG_`FRAGMENTATION_PROPERTY_KEY`=`FRAGMENTATION_PROPERTY_VALUE` (specific to the kind of fragmentation, e.g. `FRAGMENTATION_PROPERTY_KEY` = "maxzoomlevel" and `FRAGMENTATION_PROPERTY_VALUE` = "15" for geospatial fragmentation)

> **Note**: make sure to verify the settings in your personal `env.user` file to contain the correct file paths, relative to your system or the container where appropriate, etc.

> **Note**: you can set the `COMPOSE_FILE` environment property to the [docker compose file](../../../support/context/simulator-workflow-server-mongo/docker-compose.yml) so you do not need to provide it in each docker compose command. E.g.:
```bash
export COMPOSE_FILE="../../../support/context/simulator-workflow-server-mongo/docker-compose.yml"
```

You can then run the systems by executing the following command:
```bash
docker compose --env-file env.user up
```

Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `env.user` file.

Once logged in, create a new process group based on the [ingest workflow](./nifi-workflow.json) as specified in [here](../../../support/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the LDES-server.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances` -- **note** that we use an alias here to ease the use of different data sets
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-server:8080/mobility-hindrances` and the property `HTTP method` should be `POST`

The test data set contains only one version object spanning multiple tiles and therefore consists of a [single file containing one member](./data/six-members.jsonld). This data set is used:
* to demonstrate the geospatial bucketizer's ability to correctly create (multiple) buckets for a given member based on the configured property,
* to verify that the generated buckets values (`ldes:bucket`) are not present in the generated fragments and
* to illustrate the current strategy used by the geospatial fragmentation to create fragments and the relations included.

### Test Execution
To verify the above acceptance criteria:
* visualize the GIPOD hindrance
* ingest the data set
* verify the fragments
    * contains the member without buckets
    * follow all geospatial links
    * visualize the combined tiles

#### 1. Ingest the Data Set
You need to ingest the data set ([single file containing six members](./data/six-members.jsonld)) and [alias it](./create-alias.json):
```bash
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/json-ld' -d '@data/six-members.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```

After that you can start the workflow as described [here](../../../support/workflow/README.md#starting-a-workflow) and wait for the fragments to be created (call repeatedly):
```bash
curl --location --header 'Accept: application/n-quads' http://localhost:8080/mobility-hindrances
```


When the response contains the member then all fragments have been created.

Alternatively you can use the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `ldesmember` document collection contains four LDES members and the `ldesfragments` document collection contains TODO LDES fragments.

#### 2. Try-out different views and fragmentation strategies.

Try out different views and fragmentation strategies by
1. By updating the value of `VIEWS_X_NAME`, `VIEWS_X_FRAGMENTATIONS_Y_NAME` and `VIEWS_X_FRAGMENTATIONS_Y_CONFIG_`
2. Deleting the database for example using [Mongo Compass](https://www.mongodb.com/products/compass)
3. Recreating the ldes-server:
   ```
    docker compose --env-file env.user stop ldes-server  
    docker compose --env-file env.user create ldes-server
    docker compose --env-file env.user start ldes-server   
    ``` 

### Test Teardown
First stop the workflow as described [here](../../../support/workflow/README.md#stopping-a-workflow) and then stop all systems, i.e.:
```bash
docker compose --env-file env.user down
```
