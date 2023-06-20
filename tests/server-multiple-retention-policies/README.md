# LDES Server can combine multiple retention mechanisms
This test verifies that the LDES server can work with 3 different retention policies and remove members accordingly.
It also tests that the LDES server can combine multiple retention policies and remove members accordingly.

**Acceptance Criteria**
* **AC1**: The timebased retention policy removes members that are older than a given period of time.
* **AC2**: The versionbased retention policy only retains the x given newest versions of each state-object.
* **AC3**: The point in time retention policy removes all members that are older than a given point in time.
* **AC4**: I can configure multiple retention policies
* **AC5**: The LDES server automatically removes all members that match ALL retention policies

## Test Scenario

For each retention policy, we create a view with this retention.
We then send some test members to the LDES server and check if the desired number of members remain in the database.
Because the server checks every 10 seconds if members comply with the retention policies, the amount of members in the database can change in these 10 seconds.
This is noted in the test as a range between which the members stagnate.

### Start Systems

When started, we expect that the LDES server creates the initial state: the LDES itself with a collection with no views.

### Add the view and sending data

We add a paginated view with the retention policy we wish to test.
We then start sending a new member to the server every second.

### Observing member count

When now continuously poll the member count in the LDES server throughout a given period and observe if this is in line with the expected outcome.

### Test teardown

To stop the test, we stop sending data, remove the view and tear down the docker containers

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the message generators by executing the following (bash) command:
```bash
docker compose up -d
```
Please ensure that the LDES Server is ready to ingest by following the container log until you see the following message `Cancelled mongock lock daemon`:
```bash
docker logs --tail 1000 -f $(docker ps -q --filter "name=ldes-server$")
```
Press `CTRL-C` to stop following the log.

Seed the server with a collection.
```bash
curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d '@./config/mobility-hindrance.ttl'
```

Remove the default view.
```bash
curl -X DELETE 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views/by-page'
```
This step is necessary so that only the view with the desired retentionpolicy remains.
This way members will be removed from the database and the number of members can be easily queried.

Verify the initial collection is created:
```bash
curl -i http://localhost:8080/mobility-hindrances
```

## Test Timebased Retention
To execute this test scenario, run the following steps:

1. Add the timebased view:
   ```bash
   curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views' -H 'Content-Type: text/turtle' -d '@./config/view-timebased.ttl'
   ```

2. Start sending data to the LDES server:
    ```bash
    docker compose up -d ldes-message-generator
    ```

3. Repeatedly check the number of members in the database:
   ```bash
   bash ./config/poll-members.sh
   ```
   The amount of members should steadily increase until it stagnates between 30 and 40 members.

4. Stop sending data:
    ```bash
    docker compose stop ldes-message-generator
    ```

5. Repeatedly check the number of members in the database again:
   ```bash
   bash ./config/poll-members.sh
   ```
   The amount of members should decrease until it reaches 0 around 30 seconds later.

6. Remove the view:
   ```bash
   curl -X DELETE 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views/timebased'
   ```

## Test Versionbased Retention
To execute this test scenario, run the following steps:

1. Add the versionbased view:
   ```bash
   curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views' -H 'Content-Type: text/turtle' -d '@./config/view-latest-version.ttl'
   ```

2. Start sending data to the LDES server:
    ```bash
    docker compose up -d ldes-message-generator
    ```

3. Repeatedly check the number of members in the database:
   ```bash
   bash ./config/poll-members.sh
   ```
   The amount of members should steadily increase until it stagnates between 10 and 20 members.

4. Stop sending data:
   ```bash
    docker compose stop ldes-message-generator
   ```

5. Wait 10 seconds and check the number of members in the database again:
   ```bash
   bash ./config/poll-members.sh
   ```
   The amount of members should be exactly 10.

6. Remove the view:
   ```bash
   curl -X DELETE 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views/latestVersion'
   ```

## Test Point In Time Retention
To execute this test scenario, run the following steps:

1. Add the point in time view:
   ```bash
   bash ./config/post-point-in-time-view.sh
   ```

2. Start sending data to the LDES server:
    ```bash
    docker compose up -d ldes-message-generator
    ```

3. Repeatedly check the number of members in the database:
   ```bash
   bash ./config/poll-members.sh
   ```
   The amount of members should stagnate between 0 and 10 members.
   After 30 seconds since creating the view, the number of members should steadily keep increasing and exceed the 10 members.

4. Stop sending data:
   ```bash
    docker compose stop ldes-message-generator
    ```

5. Wait 10 seconds and check the number of members in the database again:
   ```bash
   bash ./config/poll-members.sh
   ```
   The amount of members should now remain constant

6. Remove the view:
   ```bash
   curl -X DELETE 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views/pointInTime'
   ```

## Test Combined Retention
In this test we will combine all 3 retention policies: timebased, versionbased and point in time.
To execute this test scenario, run the following steps:

1. Add the combined view:
   ```bash
   bash ./config/post-combined-view.sh
   ```

2. Start sending data to the LDES server:
    ```bash
    docker compose up -d ldes-message-generator
    ```

3. Repeatedly check the number of members in the database:
   ```bash
   bash ./config/poll-members.sh
   ```
   The amount of members should stagnate between 5 and 15 members.

4. Stop sending data and start sending members with another version to the LDES server:
    ```bash
    docker compose stop ldes-message-generator
    docker compose up ldes-message-generator-2
    ```
   
5. Repeatedly check the number of members in the database again:
   ```bash
   bash ./config/poll-members.sh
   ```
   The amount of members should now increase and stagnate between 10 and 20 members.
   After 1 minute since creating the view, the number of members should steadily keep increasing and exceed the 20 members.

6. Stop sending data:
   ```bash
    docker compose stop ldes-message-generator-2
    ```

7. Wait 10 seconds and check the number of members in the database again:
   ```bash
   bash ./config/poll-members.sh
   ```
   The amount of members should now remain constant.

8. Remove the view:
   ```bash
   curl -X DELETE 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views/combined'
   ```

## Test Teardown
To stop all systems use:
```bash
docker compose rm -s -f -v ldes-message-generator
docker compose rm -s -f -v ldes-message-generator-2
docker compose down
```
