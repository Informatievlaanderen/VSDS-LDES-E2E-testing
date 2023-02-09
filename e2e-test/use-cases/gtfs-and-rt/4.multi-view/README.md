# LDES Server Offers Multiple Views
This test validates user story **As a consumer I want multiple views so that I can different views on my data** and was shown during demo 1 on September, 13th 2022.

## LDES Server
The LDES Server provides some configuration to cover the following acceptance criteria:
* can configure LDES server to with multiple views
* each view of the LDES server consists of a name and a list of fragmentations. Each fragmentation consists of the name of that fragmentation (timebased/geospatial) and a set of configuration parameters
* members are ingested via endpoint '/{collectionname}' and saved once in the storage provider
* views are consulted via the endpoint '/{viewname}'

### Test Setup
To demonstrate the multi-view fragmentation, we use an adapted version of the [Simulator / Workflow / Server / Mongo](../../../support/context/simulator-workflow-server-mongo/README.md) context. If needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command. 

The environment file is already configured for two view (one geospatial & timebased and one timebased) but you can adapt the configuration settings as described [here](../../../support/context/simulator-workflow-server-mongo/README.md#multiview). 
Please note the specific configuration properties which allow to configure the amount of views and types of fragmentations (`X` represents the view number starting at 0, `Y` represents the fragmentation number starting at 0):
* VIEWS_X_NAME=name of the view
* VIEWS_X_FRAGMENTATIONS_Y_NAME=name of fragmentation (currently, only "timebased" and "geospatial" are supported)
* VIEWS_X_FRAGMENTATIONS_Y_CONFIG_`FRAGMENTATION_PROPERTY_KEY`=`FRAGMENTATION_PROPERTY_VALUE` (specific to the kind of fragmentation, e.g. `FRAGMENTATION_PROPERTY_KEY` = "maxzoomlevel" and `FRAGMENTATION_PROPERTY_VALUE` = "15" for geospatial fragmentation)

You can then run the systems by executing the following command:
```bash
docker compose up -d
```
> **Note**: it may take a minute for all the servers to start.

Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `user.env` file.

Once logged in, create a new process group based on the [ingest workflow](./nifi-workflow.json) as specified in [here](../../../support/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the LDES-server.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances` -- **note** that we use an alias here to ease the use of different data sets
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-server:8080/mobility-hindrances` and the property `HTTP method` should be `POST`

The test data set contains only one version object spanning multiple tiles and therefore consists of a [single file containing six members](./data/six-members.jsonld). This data set is used:
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
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/ld+json' -d '@data/six-members.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```

After that you can start the workflow as described [here](../../../support/workflow/README.md#starting-a-workflow) and wait for the fragments to be created (call repeatedly):
```bash
curl http://localhost:8080/mobility-hindrances/by-time
```
Initially returns:
```
@prefix tree: <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances/by-time>
        a       tree:Node .
```

When the response of this second view contains a relation then all fragments have been created:
```
@prefix tree: <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances/by-time>
        a              tree:Node ;
        tree:relation  [ a          tree:Relation ;
                         tree:node  <http://localhost:8080/mobility-hindrances/by-time?generatedAtTime=2022-10-10T18:24:31.971Z>
                       ] .
```

You can now also see the response of the first view:
```bash
curl http://localhost:8080/mobility-hindrances/by-location-and-time
```
response:
```
@prefix tree: <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances/by-location-and-time>
        a              tree:Node ;
        tree:relation  [ a          tree:Relation ;
                         tree:node  <http://localhost:8080/mobility-hindrances/by-location-and-time?tile=0/0/0>
                       ] .
```

Alternatively you can use the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `ldesmember` document collection contains four LDES members and the `ldesfragments` document collection contains 13 LDES fragments (1 timebased view + its 2 timebased fragments in addition to 1 tilebased view + 1 root tile + 4 tiles and its 4 time fragments).

#### 2. Try-out different views and fragmentation strategies.

Try out different views and fragmentation strategies by
1. By updating the value of `VIEWS_X_NAME`, `VIEWS_X_FRAGMENTATIONS_Y_NAME` and `VIEWS_X_FRAGMENTATIONS_Y_CONFIG_`
2. Deleting the database for example using [Mongo Compass](https://www.mongodb.com/products/compass)
3. Recreating the ldes-server:
   ```
    docker compose stop ldes-server  
    docker compose create ldes-server
    docker compose start ldes-server   
    ``` 

### Test Teardown
First stop the workflow as described [here](../../../support/workflow/README.md#stopping-a-workflow) and then stop all systems, i.e.:
```bash
docker compose down
```
