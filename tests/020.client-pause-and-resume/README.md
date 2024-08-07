# LDES Client Can Persist State
This test verifies that the LDES client can pause and resume replicating or synchronizing an LDES by saving respectively loading its state. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and a message sink backed by a data store (in memory).

The simulator is seeded by a subset of the Gent P+R dataset containing five fragments of which the first four fragments contain 250 members each and the last one contains 16 members, making a total of 1016 LDES members served. 

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems by executing the following (bash) command:
```bash
clear
sh ./setup.sh
```

## Test Execution
1. Upload and start the [workflow](./workbench/client-pipeline.yml) containing the LDES Client to run the replication using:
    ```bash
    curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"
    ```
    To verify that the workflow is correctly started you can run this command: 
    ```bash
    curl http://localhost:8081/admin/api/v1/pipeline/client-pipeline/status
    ```

2. Verify how many members are already ingested and stop the workflow when the member count is at least 250 members:
    ```bash
    COUNT=0 && while [ "$COUNT" -lt "250" ] ; do sleep 1; COUNT=$(curl -s http://localhost:9003 | jq '.parkAndRide.total') ; echo "count: $COUNT" ; done
    ID=$(docker ps -f "name=workbench$" -q)
    docker stop $ID
    ```

3. Verify that the message sink log file does not contain any warnings:
    ```bash
    docker logs $(docker ps -f "name=test-message-sink$" -q) | grep WARNING
    ```
    > **Note**: the log should not contain a line starting with "`[WARNING]`".

4. Continue the workflow:
   ```bash
    docker start $ID
    STARTING=-1 && while [ "$STARTING" -ne 0 ] ; do sleep 1; curl -f -s http://localhost:8081/actuator/health; STARTING=$? ; done
    curl -X POST http://localhost:8081/admin/api/v1/pipeline -H "Content-Type: application/yaml" --data-binary "@./workbench/client-pipeline.yml"
   ```


5. Wait until the LDES is fully replicated (member count will be 1016):
    ```bash
    COUNT=0 && while [ "$COUNT" -ne "1016" ] ; do sleep 1; COUNT=$(curl -s http://localhost:9003 | jq '.parkAndRide.total') ; echo "count: $COUNT" ; done
    ```

6. Verify that the message sink received all members only once:
    ```bash
    docker logs $(docker ps -f "name=test-message-sink$" -q) | grep 'overriding id'
    ```
    > **Note**: the log should not contain a line starting with "`[WARNING] overriding id`".

## Test Teardown
To stop all systems use:
```bash
sh ./teardown.sh
```
