# LDES Server makes unfragmentable members available in a default fragment
The test verifies that the LDES server can makes all received members available, even if they can not be assigned to a fragment.

The server (http://localhost:8080) is seeded by a subset of the mobility-hindrances dataset.

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the workflow by executing the following (bash) command:
```bash
docker compose up -d --wait
```

## Test Execution
1. Seed the LDES Server with a collection and a view and i send 5 members:
    ```bash
   chmod +x ./server/seed.sh
   sh ./server/seed.sh
   ```
    To verify that the [server](http://localhost:8080) is correctly seeded you can run this command: 
    ```bash
    curl http://localhost:8080/mobility-hindrances
    ```

2. Verify the root fragment of the timebased view has a relation to the default fragment and to the year=2023 fragment:
    ```bash
    curl http://localhost:8080/mobility-hindrances/time
    ```

3. Verify the default fragment contains exactly 2 members:
    ```bash
    curl 'http://localhost:8080/mobility-hindrances/time?year=unknown&pageNumber=1'
    ```

4. Verify the root fragment of the geospatial view has a relation to the default fragment and to the tile 0/0/0 fragment:
    ```bash
    curl http://localhost:8080/mobility-hindrances/geo
    ```

5. Verify the default fragment contains exactly 2 members:
    ```bash
    curl 'http://localhost:8080/mobility-hindrances/geo?tile=unknown&pageNumber=1'
    ```

6. Verify the root fragment of the reference view has a relation to the version=unknown fragment and to the version= fragment:
    ```bash
    curl http://localhost:8080/mobility-hindrances/ref
    ```

7. Verify the default fragment contains exactly 2 members:
    ```bash
    curl 'http://localhost:8080/mobility-hindrances/ref?version=unknown&pageNumber=1'
    ```

8. Verify the root fragment of the combined view has a relation to the default fragment and to the tile=0/0/0 fragment:
    ```bash
    curl http://localhost:8080/mobility-hindrances/mixed
    ```

9. Verify the default fragment contains exactly 2 members:
    ```bash
    curl http://localhost:8080/mobility-hindrances/mixed?tile=unknown&year=unknown&version=unknown&pageNumber=1
    ```
   

## Test Teardown
To stop all systems use:
```bash
docker compose rm -s -f -v ldio-workbench
docker compose --profile delay-started down
```
