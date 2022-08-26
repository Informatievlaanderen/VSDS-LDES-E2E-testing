# LDES Server Can Fragment an LDES Using Geospatial Fragmentation
This test validates user story **As a Data Intermediary (business role) I want to fragment the GTFS/RT dataset using a geo-spatial fragmentation so I can query an LDES on geographic area in a more efficient way** (VSDSPUB-207) and was shown during demo 1 on August, 26th 2022.

> **Note**: all the details of geospatial fragmentation have not yet been flushed out and we focussed on the most important criteria during this sprint so the current implementation does not yet cover all the acceptance criteria.
>
> The following criteria still need to be decided:
> * tile-to-tile relations: tile neighbors? which? N/E/S/W or also NE/NW/…
> * member fragment relations: GT/LT?
> * tile-to-member relations: all/only first/first+last?

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
To demonstrate the geospatial fragmentation, we use the [Simulator / Workflow / Server / Mongo](../../../support/context/simulator-workflow-server-mongo/README.md) context. Please copy the [environment file (env.geospatial-fragment)](./env.geospatial-fragment) to a personal file (e.g. `env.user`) and fill in the mandatory arguments. 

The environment file is already configured for geospatial fragmentation but you can tune the configuration settings as described [here](../../../support/context/simulator-workflow-server-mongo/README.md#geospatial-fragmentation). Please note the specific configuration properties which allow to configure which fragmentizer to use as well as the specific geospatial bucketizer and fragmentizer properties:
* FRAGMENTATIONLIST_FRAGMENTATIONS=`geospatial,timebased` (change to `geospatial` or `timebased` to see different fragmentation)
* GEOSPATIAL_MAXZOOMLEVEL=15 (tune as needed)
* GEOSPATIAL_BUCKETISERPROPERTY="http://www.opengis.net/ont/geosparql#asWKT" (specific to the GIPOD data set, do not change)
* GEOSPATIAL_PROJECTION=lambert72 (only projecting supported currently, do not change)

> **Note**: make sure to verify the settings in your personal `env.user` file to contain the correct file paths, relative to your system or the container where appropriate, etc.

> **Note**: you can set the `COMPOSE_FILE` environment property to the [docker compose file](../../../support/context/simulator-workflow-server-mongo/docker-compose.yml) so you do not need to provide it in each docker compose command. E.g.:
```bash
export COMPOSE_FILE="../../../support/context/simulator-workflow-server-mongo/docker-compose.yml"
```
> **Note**: the second environent variable is needed as it is defined in your `env.user` file as `LDES_SERVER_SIMULATOR_SEED_FOLDER=./data` but by setting the COMPOSE_FILE environent variable Docker interprets it as relative to the `docker-compose.yml` file instead of the `env.user` file.

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
We need to [alias it](./create-alias.json):
```bash
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```
and ingest:

```bash
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/json-ld' -d '@data/six-members.jsonld'
```

After that you can start the workflow as described [here](../../../support/workflow/README.md#starting-a-workflow) and wait for the fragments to be created (call repeatedly):
```bash
curl --location --header 'Accept: application/n-quads' http://localhost:8080/mobility-hindrances
```


When the response contains the member then all fragments have been created.

Alternatively you can use the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `ldesmember` document collection contains four LDES members and the `ldesfragments` document collection contains TODO LDES fragments.

#### 2. Try-out different fragmentation strategies.

Try out different fragmentation strategies by
1. By updating the value of `FRAGMENTATIONLIST_FRAGMENTATIONS` from `geospatial,timebased` to either `geospatial` or `timebased`
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
