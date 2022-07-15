# E2E Test Sink
The E2E test sink is a small http server used for E2E testing the LDES client NiFi processor.

## Docker
The sink can be run as a docker container, after creating a docker image for it. The docker container will keep running until stopped.

To create a docker image, run the following command:
```bash
docker build --tag vsds/ldes-client-sink .
```

To run the sink docker image mapped on port 9000, you can use:
```bash
docker run -d -p 9000:80 vsds/ldes-client-sink
```

The docker run command will return a container ID (e.g. `0cc5d65d8108f8e91778a0a4cdb6504a2b3926055ce10cb899dceb98db4c3eef`), which you need to stop the container.

Alternatively you can run `docker ps` to retrieve the (short version of the) container ID.
 ```
CONTAINER ID   IMAGE                   COMMAND                  CREATED          STATUS          PORTS                  NAMES
0cc5d65d8108   vsds/ldes-client-sink   "/usr/bin/dumb-init …"   12 seconds ago   Up 11 seconds   0.0.0.0:9000->80/tcp   intelligent_bell
 ```
To stop the container, you need to call the stop command with the (long or short) container ID, e.g. `docker stop 0cc5d65d8108`

## Build
The sink is implemented as a [node.js](https://nodejs.org/en/) application.
You need to run the following commands to build it:
```bash
npm i
npm run build
```

## Run
The sink uses a MongoDB as permanent storage to allow for large data sets.
It takes the following command line arguments:
* `--member-type` defines the member type to use to determine the member's ID (subject value), no default
* `--port=<port-number>` allows to set the port, defaults to `8080`
* `--host=<host-name>` allows to set the hostname, defaults to `localhost`
* `--silent` prevents any console debug output
* `--connection-uri` allows to set the MongoDB connection URI, defaults to `mongodb://localhost:27017`
* `--database-name` allows to set the MongoDB database name, defaults to `ldes_client_sink`
* `--collection-name` allows to set the MongoDB collection name, defaults to `members`

You can run it with one of the following command after building it:
```bash
node dist/server.js --member-type "http://schema.org/Person" --collection-name cartoons
```
This results in:
```
Arguments:  {
  _: [],
  'member-type': 'http://schema.org/Person',
  'collection-name': 'cartoons'
}
Sink listening at http://127.0.0.1:8080
```

Alternatively launch it using other arguments, e.g.:

GIPOD use case: 
```bash
node dist/server.js --member-type "https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder" --collection-name hindrances --silent
```
GTFS/RT use case: 
```bash
node dist/server.js --member-type "http://semweb.mmlab.be/ns/linkedconnections#Connection" --collection-name connections --silent
```
## Usage
The sink server accepts the following REST calls.

### `GET /` -- Retrieve number of ingested members
Returns the number of members received, e.g.
```bash
curl http://localhost:8080/
```
returns:
```json
{"cartoons":{"total":0}}
```

### `POST /member` -- Ingest members
Ingests a member as quads (mime-type: `application/n-quads`) or as triples (mime-type: `application/n-triples`) and returns the member ID (URI), e.g.
```bash
curl -X POST http://localhost:8080/member -H "Content-Type: application/n-quads" -d "@donald-duck.nq"
```
OR
```bash
curl -X POST http://localhost:8080/member -H "Content-Type: application/n-triples" -d "@donald-duck.nt"
```
returns:
```
http://example.org/id/cartoon-figure/donald-duck
```

### `GET /member` -- Get member list
Returns the (limited) list of members (as local URLs), e.g.
```bash
curl http://localhost:8080/member
```
returns (formatted for readability):
```json
{
  "cartoons": {
    "total": 1,
    "count": 1,
    "members": [
      "/member?id=http%3A%2F%2Fexample.org%2Fid%2Fcartoon-figure%2Fdonald-duck"
    ]
  }
}
```

### `GET /member?id=<url-encoded-member-id>` -- Get member content
Returns the member content as quads (if ingested with mime-type: `application/n-quads`), e.g.
```bash
curl "http://localhost:8080/member?id=http%3A%2F%2Fexample.org%2Fid%2Fcartoon-figure%2Fdonald-duck"
```
returns (formatted for readability):
```
<http://example.org/id/cartoon-figure/donald-duck> <http://schema.org/name> "Donald Duck" <http://example.org/disney>.
<http://example.org/id/cartoon-figure/donald-duck> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> <http://example.org/disney>.
```

### `DELETE /member` -- Remove all members
Removes all members, e.g.
```bash
curl -X DELETE http://localhost:8080/member
```
Returns the amount of members deleted:
```json
{"count":1}
```
