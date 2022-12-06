# LDES Server Can Fragment an LDES Using Geospatial Fragmentation
This test validates user story **As a Data Intermediary (business role) I want to fragment the GTFS/RT dataset using a geo-spatial fragmentation so I can query an LDES on geographic area in a more efficient way** (VSDSPUB-207) and was shown during demo 1 on August, 26th 2022.

## LDES Server
The LDES Server provides some configuration to cover the following acceptance criteria:
* can configure LDES server to use geo-spatial fragmentation (instead of the default time-based fragmentation)
* can configure geo-spatial bucketizer with a geospatial property ([WKT format](https://opengeospatial.github.io/ogc-geosparql/geosparql11/spec.html#_rdfs_datatype_geowktliteral))
* can configure geo-spatial bucketizer with a zoom level
* can configure geo-spatial fragmentizer with a max member count per (member) fragment

Currently, the following criteria is not yet implemented:
* can configure geo-spatial fragmentizer with a max relation count per (tile) fragment

## Bucketizer
The geospatial bucketizer covers the following acceptance criteria:
* geo-spatial bucketizer adds LDES members to one or more geo-spatial tiles based on the configured geographic property (geo-spatial bucketizer adds buckets based on the geographic property)
* geo-spatial bucketizer does not add buckets to the LDES member content (buckets are transient and passed to the geo-spatial fragmentizer)
* geo-spatial bucketizer uses (for now) a fixed algorithm for calculate the buckets ([slippy maps](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames))

As the geospatial bucketizer is an internal component we can only demonstrate its behavior by demonstrating the geospatial fragmentizer.

## Fragmentizer
The geospatial fragmentizer currently covers the following acceptance criteria but introduces an alternative implementation:
* geo-spatial fragmentizer assigns an LDES member to exactly one member fragment (but an LDES member can span multiple tiles and therefore appear in multiple member fragments - belonging to different tiles!)
* geo-spatial fragmentizer creates a tile fragment containing all available fragments per tile
* geo-spatial fragmentizer creates a root fragment containing all available tile fragments
* geo-spatial fragmentizer assigns bucket-less (e.g. missing geographic property value) members to a member fragment of an “empty” tile fragment (so no members are dropped)
* geo-spatial bucketizer and fragmentizer use the initial configuration (and do not take configuration changes into account)

Currently, the following criteria are not yet implemented:
* geo-spatial fragmentizer re-structures the search tree when the max relation count is reached for a tile fragment
* geo-spatial fragmentizer creates intermediate tile fragments on a as-needed basis and not a-priori

The current implementation takes a simplified view on how the fragments are related: every fragment contains one or more relations of type `tree:GeospatiallyContainsRelation` with its `tree:path` containing the tile's bounding box expressed as WKT. This allows a fragment to point to its neighboring fragments. In addition, every fragment already contains members.

### Test Setup
To demonstrate the geospatial fragmentation, we use an adapted version of the [Simulator / Workflow / Server / Mongo](../../../support/context/simulator-workflow-server-mongo/README.md) context. Please copy the [environment file (geospatial-fragment.env)](./geospatial-fragment.env) to a personal file (e.g. `user.env`) and fill in the mandatory arguments. 

The environment file is already configured for geospatial fragmentation but you can tune the configuration settings as described [here](../../../support/context/simulator-workflow-server-mongo/README.md#geospatial-fragmentation).

> **Note**: make sure to verify the settings in your personal `user.env` file to contain the correct file paths, relative to your system or the container where appropriate, etc.

You can then run the systems by executing the following command:
```bash
docker compose --env-file user.env up
```

Log on to the [Apache NiFi user interface](https://localhost:8443/nifi) using the user credentials provided in the `user.env` file.

Once logged in, create a new process group based on the [ingest workflow](./nifi-workflow.json) as specified in [here](../../../support/context/workflow/README.md#creating-a-workflow).

You can verify the LDES client processor properties to ensure the input source is the GIPOD simulator and the sink properties to ensure that the InvokeHTTP processor POSTs the LDES members to the LDES-server.
* the `LdesClient` component property `Datasource url` should be `http://ldes-server-simulator/api/v1/ldes/mobility-hindrances` -- **note** that we use an alias here to ease the use of different data sets
* the `InvokeHTTP` component property `Remote URL` should be `http://ldes-server:8080/mobility-hindrances` and the property `HTTP method` should be `POST`

The test data set contains only one version object spanning multiple tiles and therefore consists of a [single file containing six member](./data/six-members.jsonld). This data set is used:
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

After that you can start the workflow as described [here](../../../support/context/workflow/README.md#starting-a-workflow) and wait for the fragments to be created (call repeatedly):
```bash
curl http://localhost:8080/mobility-hindrances-by-location-and-time
```
The response should contain a relation to the geo-spatial root node (`http://localhost:8080/mobility-hindrances?tile=0/0/0/`) which contains four `GeospatiallyContainsRelation`s, each referring to a timebased fragment which contains the member (e.g. `http://localhost:8080/mobility-hindrances?tile=15/16742/11010&generatedAtTime=2022-09-22T14:40:49.379Z`).

Alternatively you can use the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `ldesmember` document collection contains six LDES members and the `ldesfragments` document collection contains one root fragment (`tile=0/0/0`), four tile fragments (e.g. `http://localhost:8080/mobility-hindrances?tile=15/16742/11010`) and four timebased fragments (e.g. `http://localhost:8080/mobility-hindrances?tile=15/16742/11010&generatedAtTime=2022-09-22T14:40:49.379Z`).

#### 2. Try-out different fragmentation strategies.

To try out a different fragmentation strategy you need to tune the [Docker Compose](./docker-compose.yml) file and follow these steps:
1. Change the strategy, e.g.:
   * Disable the current strategy (comment) and enable (uncomment) the `ALTERNATIVE STRATEGY: only timebased`
   * Disable the current strategy (comment) and enable (uncomment) the `ALTERNATIVE STRATEGY: only geospatial`
2. Delete the MongoDB database (e.g. using [Mongo Compass](https://www.mongodb.com/products/compass))
3. Recreate the ldes-server:
   ```
    docker compose --env-file user.env stop ldes-server  
    docker compose --env-file user.env create ldes-server
    docker compose --env-file user.env start ldes-server   
    ``` 
4. Restart the workflow

### Test Teardown
First stop the workflow as described [here](../../../support/context/workflow/README.md#stopping-a-workflow) and then stop all systems, i.e.:
```bash
docker compose --env-file user.env down
```
