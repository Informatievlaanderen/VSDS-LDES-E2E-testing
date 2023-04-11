# LDES Server Can Fragment an LDES Using Geospatial Fragmentation
The test verifies that the LDES Server can geo-spatially fragment an LDES. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and the LDES Server backed by a data store (mongodb).

The test data set contains only one version object spanning multiple tiles and therefore consists of a single file containing [one member](./data/one-member.jsonld). This data set is used:
* to demonstrate the geospatial bucketizer's ability to correctly create (multiple) buckets for a given member based on the configured property,
* to verify that the generated buckets values (`ldes:bucket`) are not present in the generated fragments and
* to illustrate the current strategy used by the geospatial fragmentation to create fragments and the relations included.

The GIPOD data set uses [Belgian Lambert 72](https://epsg.io/31370) as the [CRS](https://www.w3.org/2015/spatial/wiki/Coordinate_Reference_Systems) while the standard is [WGS 84](https://epsg.io/4326). In order to display a GIPOD hindrance with an [online tool](https://clydedacruz.github.io/openstreetmap-wkt-playground/) we first need to convert the geospatial value to the standard CRS. These values are polygons (with many points) while online tools only support the conversion of a single point. To ease this conversion bfrom [Belgian Lambert 72](https://epsg.io/31370) to [WGS 84](https://epsg.io/4326) we provided a [custom conversion tool](./conversion-tool/README.md).

Convert the GIPOD hindrance zone (zone.geometry.wkt) using our custom tool (it overwrites the [existing file](./wkt/out.wkt)), e.g.:
```bash
cd ./conversion-tool && npm i && cd ..
node ./conversion-tool/bd72-wgs84.js --file ./wkt/in.wkt > ./wkt/out.wkt
```

Now you can plot the [shape](./wkt/out.wkt) using the [online tool](https://clydedacruz.github.io/openstreetmap-wkt-playground/). This results in:

![GIPOD shape](./wkt/out.png)

> **Notes**:
>
> The **LDES Server** provides some configuration to cover the following acceptance criteria:
> * can configure LDES server to use geo-spatial fragmentation (instead of the default time-based fragmentation)
> * can configure geo-spatial bucketizer with a geospatial property ([WKT format](https://opengeospatial.github.io/ogc-geosparql/geosparql11/spec.html#_rdfs_datatype_geowktliteral))
> * can configure geo-spatial bucketizer with a zoom level
> * can configure geo-spatial fragmentizer with a max member count per (member) fragment
> 
> Currently, the following criteria is not yet implemented:
> * can configure geo-spatial fragmentizer with a max relation count per (tile) fragment
> 
> The **geospatial bucketizer** covers the following acceptance criteria:
> * geo-spatial bucketizer adds LDES members to one or more geo-spatial tiles based on the configured geographic property (geo-spatial bucketizer adds buckets based on the geographic property)
> * geo-spatial bucketizer does not add buckets to the LDES member content (buckets are transient and passed to the geo-spatial fragmentizer)
> * geo-spatial bucketizer uses (for now) a fixed algorithm for calculate the buckets ([slippy maps](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames))
> 
> As the geospatial bucketizer is an internal component we can only demonstrate its behavior by demonstrating the geospatial fragmentizer.
> 
> The **geospatial fragmentizer** currently does not cover the following acceptance criteria but introduces an alternative implementation:
> * geo-spatial fragmentizer assigns an LDES member to exactly one member fragment (but an LDES member can span multiple tiles and therefore appear in multiple member fragments - belonging to different tiles!)
> * geo-spatial fragmentizer creates a tile fragment containing all available fragments per tile
> * geo-spatial fragmentizer creates a root fragment containing all available tile fragments
> * geo-spatial fragmentizer re-structures the search tree when the max relation count is reached for a tile fragment
> * geo-spatial fragmentizer assigns bucket-less (e.g. missing geographic property value) members to a member fragment of an “empty” tile fragment (so no members are dropped)
> * geo-spatial bucketizer and fragmentizer use the initial configuration (and do not take configuration changes into account)
> * geo-spatial fragmentizer creates intermediate tile fragments on a as-needed basis and not a-priori
> 
> The current implementation takes a simplified view on how the fragments are related: every fragment contains one or more relations of type `tree:GeospatiallyContainsRelation` with its `tree:path` containing the tile's bounding box expressed as WKT. This allows a fragment to point to its neighboring fragments. In addition, every fragment already contains members.

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the workflow by executing the following (bash) command:
```bash
docker compose up -d
```
Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Mongock has finished`:
```bash
docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
```
Press `CTRL-C` to stop following the log.

## Test Execution
1. Ingest the data set ([single file containing one member](./data/one-member.jsonld)) and [alias it](./create-alias.json):
    ```bash
    curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/one-member.jsonld'
    curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@data/create-alias.json'
    ```

2. Start the workflow containing the LDES Client
    ```bash
    docker compose up ldio-workflow -d
    ```

3. Verify the LDES member is ingested (execute repeatedly until the `ldesmember` document collection contains 1 member):
    ```bash
    curl http://localhost:9019/gipod/ldesmember
    ```
    and the `ldesfragment` document collection contains four LDES fragments, in addition to the geo-spatial root fragment 0/0/0 and the real root/redirection fragment (i.e. expected total is 6 fragments):
    ```bash
    curl http://localhost:9019/gipod/ldesfragment
    ```

4. Verify the fragments:
    ```bash
    curl 'http://localhost:8080/mobility-hindrances/by-location?tile=0/0/0'
    ```
    We have configured the zoom level to 15, so that the geospatial fragmentation creates four tile fragments (15 / x / y)
    ```bash
    curl -s  'http://localhost:8080/mobility-hindrances/by-location?tile=0/0/0' | grep "tile=15/"
    ```
    returns:
    ```
    tree:node   <http://localhost:8080/mobility-hindrances/by-location?tile=15/16743/11010> ;
    tree:node   <http://localhost:8080/mobility-hindrances/by-location?tile=15/16744/11009> ;
    tree:node   <http://localhost:8080/mobility-hindrances/by-location?tile=15/16743/11009> ;
    tree:node   <http://localhost:8080/mobility-hindrances/by-location?tile=15/16742/11010> ;
    ```

    When combined in the appropriate way they correspond to the image we had when visualizing the member:

    |Tile|16742|16743|16744|
    |-|-|-|-|
    |**11009**||![16743/11009](https://tile.openstreetmap.org/15/16743/11009.png)|![16744/11009](https://tile.openstreetmap.org/15/16744/11009.png)|
    |**11010**|![16742/11010](https://tile.openstreetmap.org/15/16742/11010.png)|![16743/11010](https://tile.openstreetmap.org/15/16743/11010.png)||

## Test Teardown
To stop all systems use:
```bash
docker compose stop ldio-workflow
docker compose --profile delay-started down
```
