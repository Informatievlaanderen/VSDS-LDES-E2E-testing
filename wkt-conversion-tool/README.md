# Belgian Lambert 72 to WGS 84 Convertor
This little utility is capable of converting a geospatial polygon specified in geo:wktLiteral format to its WGS 84 counterpart.

Its main purpose is to allow plotting the polygon in the [OpenStreetMap WKT Playground](https://clydedacruz.github.io/openstreetmap-wkt-playground/).

## Usage
> **Note**: you will need to install [Node.js](https://nodejs.org/en/) to run the utility. 

To convert a [wkt](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) file in [BD72](https://epsg.io/31370) to its [WGS 84](https://epsg.io/4326) form, execute the following bash instruction:

```bash
node main.js --file ./in.wkt > ./out.wkt
```
or alias it:
```bash
alias bd72-wgs84="node main.js --file"
bd72-wgs84 ./in.wkt > ./out.wkt
```
