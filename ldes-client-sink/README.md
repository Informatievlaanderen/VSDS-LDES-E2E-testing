# E2E Client Sink
The E2E Client Sink is a small HTTP server used for E2E testing the LDES client NiFi processor.

## Docker
The sink can be run as a Docker container, using a pre-built container or after creating a Docker image for it locally. The Docker container will keep running until stopped.

To create a Docker image, run the following command:
```bash
docker build --tag vsds/ldes-client-sink .
```

You can use a MongoDB as a member store. Please ensure you run a MongoDB instance locally or use an online instance. Configure the Docker container to use that instance or configure and use the [Docker compose file](./docker-compose.yml) that has been provided. Alternatively you can use an in-memory database (simple object store).

To run the sink Docker image mapped on port 9000 using a MongoDB, you can use:
```bash
docker run -d -p 9000:80 --add-host=host.docker.internal:host-gateway \
-e MEMBER_TYPE="http://schema.org/Person" -e COLLECTION_NAME="cartoons" \
-e CONNECTION_URI="mongodb://host.docker.internal:27017" -e DATABASE_NAME="test" \
vsds/ldes-client-sink
```

Alternatively, with an in-memory database:
```bash
docker run -d -p 9000:80 --add-host=host.docker.internal:host-gateway \
-e MEMBER_TYPE="http://schema.org/Person" -e COLLECTION_NAME="cartoons" \
-e MEMORY=true \
vsds/ldes-client-sink
```


The Docker run command will return a container ID (e.g. `0cc5d65d8108f8e91778a0a4cdb6504a2b3926055ce10cb899dceb98db4c3eef`), which you need to stop the container.

Alternatively you can run `docker ps` to retrieve the (short version of the) container ID.
 ```
CONTAINER ID   IMAGE                   COMMAND                  CREATED          STATUS          PORTS                  NAMES
0cc5d65d8108   vsds/ldes-client-sink   "/usr/bin/dumb-init …"   12 seconds ago   Up 11 seconds   0.0.0.0:9000->80/tcp   intelligent_bell
 ```
To stop the container, you need to call the stop command with the (long or short) container ID, e.g. `docker stop 0cc5d65d8108`

## Docker compose
For your convenience a [Docker compose file](./docker-compose.yml) is provided containing the client sink and a MongoDB store, and a [.env](./.env) file with environment variables used for building and running the containers. The sink variables typically need tuning for your use case. The easiest way to provide these is to copy the `.env` file into a file named `user.env` and change the variables as required. Then you can run the following command to build and run the Docker containers:

```bash
docker compose --env-file user.env up
```

## Build
The sink is implemented as a [Node.js](https://nodejs.org/en/) application.
You need to run the following commands to build it:
```bash
npm i
npm run build
```

## Run
The sink uses a MongoDB as permanent storage to allow for large data sets, so before running the sink, make sure your MongoDB instance is running.

The sink takes the following command line arguments:
* `--member-type` defines the member type to use to determine the member's ID (subject value), no default
* `--port=<port-number>` allows to set the port, defaults to `9000`
* `--host=<host-name>` allows to set the hostname, defaults to `localhost`
* `--silent=<true|false>` prevents any console debug output if true, defaults to false (not silent, logging all debug info)
* `--connection-uri` allows to set the MongoDB connection URI, defaults to `mongodb://localhost:27017`
* `--database-name` allows to set the MongoDB database name, defaults to `ldes_client_sink`
* `--collection-name` allows to set the MongoDB collection name, defaults to `members`
* `--memory` allows to use an in-memory database for smaller data sets instead of MongoDB, defaults to false

You can run the sink with one of the following command after building it:
```bash
node dist/server.js --member-type "http://schema.org/Person" --collection-name cartoons --memory true
```
This results in:
```
Arguments:  {
  _: [],
  'member-type': 'http://schema.org/Person',
  'collection-name': 'cartoons'
}
Sink listening at http://127.0.0.1:9000
```

## Usage
The sink server accepts the following REST calls.

### `GET /` -- Retrieve Number of Ingested Members
Returns the number of members received, e.g.
```bash
curl http://localhost:9000/
```
returns:
```json
{"cartoons":{"total":0}}
```

### `POST /member` -- Ingest Members
Ingests a member as quads (mime-type: `application/n-quads`) or as triples (mime-type: `application/n-triples`) and returns the member ID (URI), e.g.
```bash
curl -X POST http://localhost:9000/member -H "Content-Type: application/n-quads" -d "@donald-duck.nq"
```
OR
```bash
curl -X POST http://localhost:9000/member -H "Content-Type: application/n-triples" -d "@donald-duck.nt"
```
returns:
```
http://example.org/id/cartoon-figure/donald-duck
```

### `GET /member` -- Get Member List
Returns the (limited) list of members (as local URLs), e.g.
```bash
curl http://localhost:9000/member
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

### `GET /member?id=<url-encoded-member-id>` -- Get Member Content
Returns the member content as quads (if ingested with mime-type: `application/n-quads`), e.g.
```bash
curl "http://localhost:9000/member?id=http%3A%2F%2Fexample.org%2Fid%2Fcartoon-figure%2Fdonald-duck"
```
returns (formatted for readability):
```
<http://example.org/id/cartoon-figure/donald-duck> <http://schema.org/name> "Donald Duck" <http://example.org/disney>.
<http://example.org/id/cartoon-figure/donald-duck> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> <http://example.org/disney>.
```

### `DELETE /member` -- Remove all Members
Removes all members, e.g.
```bash
curl -X DELETE http://localhost:9000/member
```
Returns the amount of members deleted:
```json
{"count":1}
```
