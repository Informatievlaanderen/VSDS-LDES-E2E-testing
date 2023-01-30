# LDES Server Performance is Adequate for GTFS/RT Processing
This test validates user story **Ingest GTFS-RT De Lijn for acceptance** (VSDSPUB-299) performance-wise.

### Test Setup
For this scenario we can use the a [custom context](./docker-compose.yml) derived from [GTFS2LDES / Workflow / Server / Mongo](../../../support/context/gtfs2ldes-workflow-server-mongo/README.md) context, but excluding the Workflow system. Please copy the [environment file (direct.env)](./direct.env) to a personal file (e.g. `user.env`) and fill in the mandatory arguments and append the specific `<gtfs-use-case>.env` file to your personal file.

> **Note**: make sure to verify the settings in your personal `user.env` file to contain the correct file paths, relative to your system or the container where appropriate, etc. Also ensure that the file paths actually exist, if not, create then. E.g.:
>
> for NMBS data set: `mkdir -p ~/data/gtfs/nmbs/lc/; mkdir ~/data/gtfs/nmbs/db/`
>
> for De Lijn data set: `mkdir -p ~/data/gtfs/delijn/lc/; mkdir ~/data/gtfs/delijn/db/`

> **Note**: for the [GTFS(RT) data from De Lijn](https://data.delijn.be/) you will need to request a subcription and then you will receive an API (authentication) key which is required to receive the realtime changes.

Then you can create the images and run all systems by executing the following command:
```bash
docker compose --env-file user.env up
```

### Test Execution
To run the test, you need to:
1. Wait for the GTFS to LDES convertor to start sending GTFS data (connections).
2. Verify that the LDES server can keep up with the stream of linked connections being pushed for both the schedule (may take 24 hours or more) and the real-time updates.

#### 1. Start the GTFS to LDES convertor
Watch the Docker logs for the GTFS to LDES convertor to know when it starts sending GTFS connections to the workflow.
> **Note**: you can lookup the container ID using `docker ps`, so to get the logs you can use:
```bash
docker logs --follow $(docker ps -f "name=gtfs2ldes-js" -q)
```

#### 2. Verify LDES Members Received And Fragments Created
To verify that the LDES server can keep up with the stream of linked connections from the GTFS to LDES convertor, you can use the [LDES list fragments tool](/ldes-list-fragments/README.md). By default, the trottle rate (THROTTLE_RATE) and the fragment member limit (VIEWS_0_FRAGMENTATIONS_1_CONFIG_MEMBERLIMIT) are set to the same value (100), so for every batch of linked connections being ingested, the LDES server creates one fragment. The LDES list fragments tool follows the newly created fragments. That way you can verify that the LDES server keeps up with the rate.

To start following the fragments being created:
```bash
docker compose --env-file user.env up ldes-list-fragments
```

Additionally, you can use the [Mongo Compass](https://www.mongodb.com/products/compass) tool to verify the amount of LDES members ingested(check the document count).
> **Note**: that we store the document collection in a database as configured in the Docker environment argument `SPRING_DATA_MONGODB_DATABASE`.

### Test Teardown
Stop all systems using:
```bash
docker compose --env-file user.env --profile delay-started down
```
