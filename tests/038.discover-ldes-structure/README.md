# LDES Client Can Replicate an LDES

The test verifies that the LDES Client can replicating a (small subset of the) Gent P+R dataset. It uses a context
containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and
a message sink backed by a data store (mongodb).

The simulator (http://localhost:9011) is seeded by a subset of the Gent P+R dataset containing five fragments of which
the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES
members served.

## Test Setup

> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the
> settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the workflow by executing the following (bash) command:

```bash
docker compose up -d
```

## Test Execution

1. Seed the LDES Server Simulator with a part of the Gent P+R data set and [alias it](./create-alias.json):
    ```bash
    for f in ../../data/parkAndRide/*; do curl -X POST "http://localhost:9011/ldes" -H "Content-Type: text/turtle" -d "@$f"; done
    curl -X POST "http://localhost:9011/alias" -H "Content-Type: application/json" -d '@data/create-alias.json'
    ```
   To verify that the [simulator](http://localhost:9011/) is correctly seeded you can run this command:
    ```bash
    curl http://localhost:9011/
   ```

2. Start the workflow containing the LDES Client to run the replication using:
    ```bash
    docker compose up ldes-discoverer -d
    while ! docker logs $(docker ps -q -f "name=ldes-discoverer$") | grep 'Started Application in' ; do sleep 1; done
    ```
   
3. Verify the LDES structure
You can check the logs of the ldes-discoverer container by executing the following command:
```shell
docker logs $(docker ps -qaf "name=ldes-discoverer$")
```

You can verify in the logs of the ldes-discoverer container, which should look something like this:
```turtle
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix tree: <https://w3id.org/tree#> .

<http://localhost:9003/ldes/occupancy/by-page?pageNumber=1>
        tree:relation   [ rdf:type   tree:Relation ;
                          tree:node  <http://localhost:9003/ldes/occupancy/by-page?pageNumber=2>
                        ] .

<http://localhost:9003/ldes/occupancy/by-page?pageNumber=2>
        tree:relation   [ rdf:type   tree:Relation ;
                          tree:node  <http://localhost:9003/ldes/occupancy/by-page?pageNumber=3>
                        ] .
                        
<http://localhost:9003/ldes/occupancy/by-page?pageNumber=3>
        tree:relation   [ rdf:type   tree:Relation ;
                          tree:node  <http://localhost:9003/ldes/occupancy/by-page?pageNumber=4>
                        ] .
                        
<http://localhost:9003/ldes/occupancy/by-page?pageNumber=4>
        tree:relation   [ rdf:type   tree:Relation ;
                          tree:node  <http://localhost:9003/ldes/occupancy/by-page?pageNumber=5>
                        ] .
```

## Test Teardown
To stop all systems use:
```bash
docker compose down
```