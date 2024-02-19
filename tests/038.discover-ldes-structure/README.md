# LDES Discoverer can discover the structure of an event stream or view

The test verifies that the LDES Discoverer can discover the structure of a (small subset of the) Geomobility dataset.
It uses a context containing a (LDES Server) simulator serving the fragments and the LDES Discoverer.

The simulator (http://localhost:9011) is seeded by a subset of the Geomobility dataset containing a root fragment which
refers to a view with a timebased hierarchical fragmentation strategy and a view without a fragmentation strategy,
leading to only paginate the members.

## Test Setup

> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the
> settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

Run all systems except the workflow by executing the following (bash) command:

```bash
docker compose up -d
```

## Test Execution

1. Seed the LDES Server Simulator with a part of the Gent P+R data set and [alias it](./create-alias.json):
    ```bash
    for f in ../../data/geomobility/*; do curl -X POST "http://localhost:9011/ldes" -H "Content-Type: text/turtle" -d "@$f"; done
    curl -X POST "http://localhost:9011/alias" -H "Content-Type: application/json" -d '@data/create-alias.json'
    ```
   To verify that the [simulator](http://localhost:9011/) is correctly seeded you can run this command:
    ```bash
    curl http://localhost:9011/
   ```

2. Start the LDES Discoverer to run the discovery using:
    ```bash
    docker compose up ldes-discoverer -d
    while ! docker logs $(docker ps -q -a -f "name=ldes-discoverer$") | grep 'Started Application in' ; do sleep 1; done
    ```

3. Verify the LDES structure
   You can check the logs of the ldes-discoverer container by executing the following command:

```shell
docker compose logs ldes-discoverer --no-log-prefix
```

You can verify in the logs of the ldes-discoverer container, which should look like this:

```text
http://ldes-server-simulator/ldes/observations
+- http://ldes-server-simulator/ldes/observations/by-time
|  +- http://ldes-server-simulator/ldes/observations/by-time?year=2022
|  |  +- http://ldes-server-simulator/ldes/observations/by-time?year=2022&month=08
|  +- http://ldes-server-simulator/ldes/observations/by-time?year=2023
|     +- http://ldes-server-simulator/ldes/observations/by-time?year=2023&month=05
|        +- http://ldes-server-simulator/ldes/observations/by-time?year=2023&month=05&day=07
|        +- http://ldes-server-simulator/ldes/observations/by-time?year=2023&month=05&day=16
|        +- http://ldes-server-simulator/ldes/observations/by-time?year=2023&month=05&day=20
+- http://ldes-server-simulator/ldes/observations/paged
   +- http://ldes-server-simulator/ldes/observations/paged?pageNumber=1
```

## Test Teardown

To stop all systems use:

```bash
docker compose down ldes-discoverer
docker compose down
```