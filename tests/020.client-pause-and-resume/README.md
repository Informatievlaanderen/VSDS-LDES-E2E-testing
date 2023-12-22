# LDES Client Can Persist State
This test verifies that the LDES client can pause and resume replicating or synchronizing an LDES by saving respectively loading its state. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and a message sink backed by a data store (in memory).

The simulator is seeded by a subset of the Gent P+R dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served. 

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the workflow by executing the following (bash) command:
```bash
docker volume create ldes-client-state
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

2. Start the workflow containing to ingest the members:
   ```bash
   docker compose up ldio-workbench -d
   while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
   ```

3. Verify how many members are already ingested (execute repeatedly):
    ```bash
    curl http://localhost:9003
    ```

4. Stop the workflow when the member count is around 250 members:
   ```bash
   export id=$(docker ps -f "name=workbench$" -q)
   docker stop $id
   ```

5. Verify that the message sink log file does not contain any warnings:
    ```bash
    docker logs $(docker ps -f "name=test-message-sink$" -q) | grep WARNING
    ```
    > **Note**: the log should not contain a line starting with "`[WARNING]`".

6. Continue the workflow:
   ```bash
   docker start $id
   ```
   until the LDES is fully replicated (member count will be 1016):
    ```bash
    curl http://localhost:9003
    ```

7. Verify that the message sink received all members only once:
    ```bash
    docker logs $(docker ps -f "name=test-message-sink$" -q) | grep 'overriding id'
    ```
    > **Note**: the log should not contain a line starting with "`[WARNING] overriding id`".

## Test Teardown
To stop all systems use:
```bash
docker compose rm -s -f -v ldio-workbench
docker compose down
docker volume rm ldes-client-state
```
