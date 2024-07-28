# LDES Client Can Synchronize with an LDES with relative urls
The test verifies that the LDES Client can synchronize a data set using relative uri's. It uses a context containing an LDES Server serving the fragments, a workflow containing the LDES Client and a http sender and a message sink backed by a data store (mongodb).

The server (http://localhost:8080) is seeded by a subset of the mobility-hindrances dataset.

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the workflow by executing the following (bash) command:
```bash
docker compose up -d
```

## Test Execution
1. Seed the LDES Server with a collection and a view and i send 5 members:
    ```bash
   chmod +x ./config/seed.sh
   sh ./config/seed.sh
   ```
    To verify that the [server](http://localhost:8080) is correctly seeded you can run this command: 
    ```bash
    curl http://localhost:8080/mobility-hindrances
    ```

2. Start the workflow containing the LDES Client using:
    ```bash
    docker compose up ldio-workbench -d
    while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
    ```
    > **Note**: for the [NiFi workbench](https://localhost:8443/nifi/) you also need to upload the [workflow](./nifi-workflow.json) and start it

3. Verify LDES members are correctly received

    You can verify that, after some time, all LDES members are received by the sink HTTP server by visit the following pages: http://localhost:9003 (count) and http://localhost:9003/member (LDES member ids).

    Please run the following command repeatedly until it returns the correct member count:
    ```bash
    curl http://localhost:9003/
    ```

## Test Teardown
To stop all systems use:
```bash
docker compose rm -s -f -v ldio-workbench
docker compose --profile delay-started down
```
