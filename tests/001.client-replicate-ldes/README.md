# LDES Client Can Replicate an LDES
The test verifies that the LDES Client can replicating a (small subset of the) Gent P+R dataset. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and a message sink backed by a data store (mongodb).

The simulator (http://localhost:9011) is seeded by a subset of the Gent P+R dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served.

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems by executing the following (bash) command:
```bash
clear
sh ./setup.sh
```

## Test Execution
1. Seed the LDES Server Simulator with a part of the Gent P+R data set and [alias it](./create-alias.json):
    ```bash
    for f in ../../data/parkAndRide/*; do curl -X POST "http://localhost:9011/ldes" -H "Content-Type: text/turtle" -d "@$f"; done
    curl -X POST "http://localhost:9011/alias" -H "Content-Type: application/json" -d '@simulator/create-alias.json'
    ```
    To verify that the [simulator](http://localhost:9011/) is correctly seeded you can run this command: 
    ```bash
    curl http://localhost:9011/
    ```

2. Upload and start the [workflow](./workbench/client-pipeline.yml) containing the LDES Client to run the replication using:
    ```bash
    curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"
    ```
    To verify that the workflow is correctly started you can run this command: 
    ```bash
    curl http://localhost:8081/admin/api/v1/pipeline/client-pipeline/status
    ```

3. Verify LDES members are correctly received

    You can verify that, after some time, all (1016) LDES members are received by the sink HTTP server by visit the following pages: http://localhost:9003 (count) and http://localhost:9003/member (LDES member ids).

    Please run the following command until it returns the correct member count:
    ```bash
    while :; do curl http://localhost:9003/ ; sleep 3 ; done
    ```
    Press `CTRL-C` to stop checking the count.


## Test Teardown
To stop all systems use:
```bash
sh ./teardown.sh
```
