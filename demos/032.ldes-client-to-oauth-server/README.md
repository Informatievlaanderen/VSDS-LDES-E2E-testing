# LDES Client can consume an OAUTH 2 protected endpoint using client-credentials
The test verifies that the LDES Client can consume data from an OAUTH 2 protected server.
It uses a context containing a (LDES Server) simulator serving the fragments, an NGINX reverse proxy in front of the simulator,
an Oauth 2 server, a workflow containing the LDES Client and a http sender and the LDES Server backed by a data store (mongodb).

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
   docker compose up ldio-oauth-ldes-client -d
   ```
   ```bash
   docker compose up test-message-generator -d
   ```

3. Verify LDES members are correctly received
   ```bash
   curl http://localhost:9019/gipod/ldesmember
   ```
   Please run the previous command repeatedly until it returns the correct member count (1016).

   > **Note**: there are more alternatives to verify the member count in the database. See [notes](#notes) below.

4. Verify that the nginx endpoint returns forbidden when it is called without correction authorization
    ```bash
    curl http://localhost:9020/api/v1/ldes/mobility-hindrances
    ```
   The above call should return 403 - forbidden.

## Test Teardown
To stop all systems use:
```bash
docker compose stop ldio-workflow
docker compose --profile delay-started down
```

## Notes
To verify the member count, alternatively use the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `gipod.ldesmember` document collection contains all the LDES members (check the document count).
