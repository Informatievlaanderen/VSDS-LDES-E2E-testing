# LDES Server Can Ingest LDES Members
This test validates user story **As a data intermediary I want to request the GIPOD LDES data set without fragmentation** (VSDSPUB-61) and was shown during demo 2 on May, 24th 2022.

The test verifies that the LDES Server can ingest a (small subset of the) GIPOD data set. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and the LDES Server backed by a data store (mongodb).

The simulator is seeded by a subset of the GIPOD dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served. 

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
1. Upload the GIPOD data subset and [alias it](./create-alias.json)
```bash
for f in ../../../data/gipod/*; do curl -X POST "http://localhost:9011/ldes" -H "Content-Type: application/ld+json" -d "@$f"; done
curl -X POST "http://localhost:9011/alias" -H "Content-Type: application/json" -d '@create-alias.json'
```
To verify that the simulator (http://localhost:9011/) is correctly seeded you can run this command: `curl http://localhost:9011/`

2. Start the workflow containing to ingest the members:
```bash
docker compose up ldio-workflow -d
```

3. Verify LDES members are correctly received
```bash
curl http://localhost:9019/gipod/ldesmember
```
Please run the previous command repeatedly until it returns the correct member count (1016).
> **Note**: there are more alternatives to verify the member count in the database. See [notes]() below.

## Test Teardown
To stop all systems use:
```bash
docker compose stop ldio-workflow
docker compose --profile delay-started down
```

## Notes
To verify the member count, alternatively use the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `gipod.ldesmember` document collection contains all the LDES members (check the document count).

To get the **LDES** (event stream) itself use:
```bash
curl http://localhost:8080/mobility-hindrances
```
response (simplified):
```
@prefix ldes:                <https://w3id.org/ldes#> .
@prefix mobility-hindrances: <https://private-api.gipod.test-vlaanderen.be/api/v1/ldes/mobility-hindrances/> .
@prefix tree:                <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances>
        a           ldes:EventStream ;
        tree:shape  mobility-hindrances:shape ;
        tree:view   <http://localhost:8080/mobility-hindrances/by-time> .
```
You can follow the `tree:view` link to get the **view**:
```bash
curl http://localhost:8080/mobility-hindrances/by-time
```
response (simplified):
```
@prefix ldes:                <https://w3id.org/ldes#> .
@prefix mobility-hindrances: <https://private-api.gipod.test-vlaanderen.be/api/v1/ldes/mobility-hindrances/> .
@prefix tree:                <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances/by-time>
        a              tree:Node ;
        tree:relation  [ a          tree:Relation ;
                         tree:node  <http://localhost:8080/mobility-hindrances/by-time?generatedAtTime=2023-01-13T20:38:13.134Z>
                       ] .

<http://localhost:8080/mobility-hindrances>
        a           ldes:EventStream ;
        tree:shape  mobility-hindrances:shape ;
        tree:view   <http://localhost:8080/mobility-hindrances/by-time> .
```
This allows you to follow the `tree:node` and retrieve the **fragment** containing the members:
```
curl <replace-by-tree:node>
```
> **Note**: you can also verify that the fragment contains 1016 members by capturing the response to a file and counting the number of occurrences of `<https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder>`. E.g.:
```
curl --silent <replace-by-tree:node> | grep "<https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder>" | wc -l
```
response: 1016
