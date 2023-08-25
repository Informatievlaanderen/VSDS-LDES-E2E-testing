# LDES Server Can Ingest LDES Members
The test verifies that the LDES Server can ingest a (small subset of the) GIPOD data set. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and the LDES Server backed by a data store (mongodb).

The simulator is seeded by a subset of the GIPOD dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served. 

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the workflow by executing the following (bash) command:
```bash
docker compose up -d
```
Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Cancelled mongock lock daemon`:
```bash
docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
```
Press `CTRL-C` to stop following the log.

> **Note**: as of server v1.0 which uses dynamic configuration you need to execute the [seed script](./config/seed.sh) to setup the LDES with its views:
```bash
chmod +x ./config/seed.sh
sh ./config/seed.sh
```

## Test Execution
1. Seed the LDES Server Simulator with a part of the GIPOD data set and [alias it](./create-alias.json):
    ```bash
    for f in ../../data/gipod/*; do curl -X POST "http://localhost:9011/ldes" -H "Content-Type: application/ld+json" -d "@$f"; done
    curl -X POST "http://localhost:9011/alias" -H "Content-Type: application/json" -d '@data/create-alias.json'
    ```
    To verify that the [simulator](http://localhost:9011/) is correctly seeded you can run this command: 
    ```bash
    curl http://localhost:9011/
    ```

2. Start the workflow containing to ingest the members:
    ```bash
    docker compose up ldio-workbench -d
    while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```
    or:
    ```bash
    docker compose up nifi-workbench -d
    while ! curl -s -I "http://localhost:8000/nifi/"; do sleep 5; done
    ```
    > **Note**: for the [NiFi workbench](http://localhost:8000/nifi/) you also need to upload the [workflow](./nifi-workflow.json) and start it

3. Verify LDES members are correctly received
   You can also verify that (after some time) the fragment contains 1016 members by capturing the response to a file and counting the number of occurrences of `<https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder>`. E.g.:
    ```
    while :; do curl --silent http://localhost:8080/mobility-hindrances/by-page?pageNumber=1 | grep "<https://data.vlaanderen.be/ns/mobiliteit#Mobiliteitshinder>" | wc -l; sleep 5; done
    ```
    Press `CTRL-C` to stop the loop.

## Test Teardown
To stop all systems use:
```bash
docker compose rm -s -f -v ldio-workbench
docker compose down
```
or:
```bash
docker compose rm -s -f -v nifi-workbench
docker compose down
```
