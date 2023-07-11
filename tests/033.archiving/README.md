# The LDES workbench can be used to archive the LDES Server

This test verifies:
- A file archive can be created from an LDES on the server using the workbench.
- A server can be seeded from a file archive using the workbench.

![img](artwork/test-33.drawio.png)

The message generator creates messages and sends these to an LDIO server seeder workflow.
This workflow creates version objects and seeds the LDES server.
The 'create-archive-workbench' has an LDES Client that consumes the LDES server and uses the archive file out component to write the members to a file archive.
The 'read-archive-workbench' has an archive file in component to consume the archive and post the members to the server using the Http out component.

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

1. Seed the LDES Server by starting the message generator:
   ```bash
   docker compose up test-message-generator -d
   ```

2. Start the workflow with the LDES client:
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

3. Verify LDES members are correctly ingested by the server
   ```bash
   curl http://localhost:9019/iow/ldesmember
   ```
4. Stop the message generator
   ```bash
   docker compose rm -s -f -v test-message-generator
   ```
5. Archive the members on the server by starting the archiving workflow
   ```bash
   docker compose up create-archive-workbench -d
   while ! docker logs $(docker ps -q -f "name=ldio-workbench$") | grep 'Started Application in' ; do sleep 1; done
   ```
6. Verify the archive
7. Remove the eventstream from the server
8. Create the new empty eventstream on the server
9. Restore the archive
10. Verify server

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

## Notes
To verify the member count, alternatively use the [Mongo Compass](https://www.mongodb.com/products/compass) tool and verifying that the `gipod.ldesmember` document collection contains all the LDES members (check the document count).
