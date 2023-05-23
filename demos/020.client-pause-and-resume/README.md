# LDES Client Can Persist State
This test verifies that the LDES client can pause and resume replicating or synchronizing an LDES by saving respectively loading its state. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and a message sink backed by a data store (in memory).

The simulator is seeded by a subset of the GIPOD dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served. 

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the workflow by executing the following (bash) command:
```bash
docker compose up -d
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
    returns:
    ```json
    {
    "aliases": [
        "/api/v1/ldes/mobility-hindrances"
    ],
    "fragments": [
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-19T12:12:49.47Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-21T09:38:34.617Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-04-28T14:50:23.317Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-06T11:55:00.313Z",
        "/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-13T11:36:49.04Z"
    ],
    "responses": {}
    }
    ```

2. Start the workflow containing to ingest the members:
   ```bash
   docker compose up ldio-workbench -d
   ```

3. Verify how many members are already ingested (execute repeatedly):
    ```bash
    curl http://localhost:9003
    ```

4. Stop the workflow when the member count is around 250 members:
   ```bash
   docker stop ldio-workbench
   ```

5. Verify which fragments have been requested by the workflow:
    ```bash
    curl http://localhost:9011/
    ```
    > **Note**: the response contains the `responses` which shows for each requested fragment how many times it was requested and at which moment(s) in time.

6. Continue the workflow:
   ```bash
   docker start ldio-workbench
   ```
   until the LDES is fully replicated (member count will be 1016):
    ```bash
    curl http://localhost:9003
    ```

7. Verify which fragments have been requested by the workflow:
    ```bash
    curl http://localhost:9011/
    ```
    > **Note**: all except the first fragment should be requested exactly once. The frst fragment may be requested twice because of the internal workings of the LDEs client.

## Test Teardown
To stop all systems use:
```bash
docker compose stop ldio-workbench
docker compose --profile delay-started down
```
