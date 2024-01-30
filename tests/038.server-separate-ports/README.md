# LDES Server can be configured with different ports
This scenario verifies that the LDES server can be configured to use different ports for its fetch, ingest and admin api's.

## Test Setup
1. Run all systems
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
1. Testing the admin API
   The admin API should be available on port 8089.
   To test this we can see that the following command will return a 404:
   ```bash
   curl -i -X GET 'http://localhost:8088/admin/api/v1/eventstreams'
   ```
   While this commmand will return an overview with 1 eventstream:
   ```bash
   curl -i -X GET 'http://localhost:8087/admin/api/v1/eventstreams'
   ```
   
   The swagger API should be available under the same port, we can test this by checking if the following command returns the swagger docs:
      ```bash
   curl -i -X GET 'http://localhost:8087/v3/api-docs'
   ```

2. Testing the ingest API
   The ingest API should be available on port 8088.
   To test this we will try to send a member to port 8087 and see this will return a 404:
   ```bash
   curl -i -X POST 'http://localhost:8087/mobility-hindrances' -H 'Content-Type: text/turtle' -d '@C:\Users\pieterjl\IdeaProjects\VSDS-LDES-E2E-testing\tests\038.server-separate-ports\data\member.ttl'
   ```
   While this commmand will return a 201 status code:
   ```bash
   curl -i -X POST 'http://localhost:8089/mobility-hindrances' -H 'Content-Type: text/turtle' -d '@C:\Users\pieterjl\IdeaProjects\VSDS-LDES-E2E-testing\tests\038.server-separate-ports\data\member.ttl'
   ```

3. Testing the fetch API
   The fetch API should be available on port 8087.
   To test this we will try to fetch the ldes on port 8088 and see this will return a 404:
   ```bash
   curl -i -X GET 'http://localhost:8087/mobility-hindrances'
   ```
   While this commmand will return the ldes:
   ```bash
   curl -i -X GET 'http://localhost:8088/mobility-hindrances'
   ```


## Test Teardown
To stop all systems use:
```bash
docker compose rm -s -f -v ldio-workbench
docker compose down
```