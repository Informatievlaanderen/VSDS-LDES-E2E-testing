# Convert Water Quality NGSI to OSLO Model

This test verifies the convertion towards OSLO models, more specific, it demonstrates converting the [NGSI water quality model](https://github.com/smart-data-models/dataModel.WaterQuality) into its [OSLO model](https://data.vlaanderen.be/standaarden/standaard-in-ontwikkeling/vocabularium-en-applicatieprofiel-oslo-waterkwaliteit.html).

The test uses the same setup as the [NGSI-v2 to NGSI-LD conversion test](../3.ngsi-v2-to-ldes/README.md) but adds an additional component in the Apache NiFi workflow to convert the NGSI-LD to the OSLO model. This conversion happens after converting the incoming NGSI-v2 model to the NGSI-LD model and before creating a version object and sending that to an LDES server.

The conversion from NGSI-LD to OSLO is a JSON-to-JSON format conversion and can be done using a standard Apache NiFi component ([JOLT](https://jolt-demo.appspot.com/#inception) transform [processor](https://nifi.apache.org/docs/nifi-docs/components/org.apache.nifi/nifi-standard-nar/1.17.0/org.apache.nifi.processors.standard.JoltTransformJSON/index.html)).


## Test Setup
To setup this test, you need to configure your environment file, launch the systems and verify the initial state.

### Configure Environment File
Please copy the [environment file (jolt.env)](./jolt.env) to a personal file (e.g. `user.env`) and fill in the mandatory arguments:

* SINGLE_USER_CREDENTIALS_USERNAME (Apache NiFi single user credentials - user name)
* SINGLE_USER_CREDENTIALS_PASSWORD (Apache NiFi single user credentials - password)
* MONGODB_DATA_FOLDER (location on your local system for storing LDES Server data, e.g. `~/data/iow/db`, make sure it exists!)

Optionally, you can change the component tags:

* JSON_DATA_GENERATOR_TAG (default: 20221206t0913)
* LDES_WORKBENCH_NIFI_TAG (default: 20221205t135134)
* LDES_SERVER_TAG (default: 20221205t1357)
* MONGODB_TAG (default: 6.0.3)

### Launch Systems
Please set the `COMPOSE_FILE` environment property to the [docker compose file](../3.ngsi-v2-to-ldes/docker-compose.yml) so you do not need to provide it in each docker compose command. I.e.:
```bash
export COMPOSE_FILE="../3.ngsi-v2-to-ldes/docker-compose.yml"
```
Now, you can start all the required systems except for the observations generator:
```bash
docker compose --env-file user.env up
```

### Verify Initial State
Once the LDES servers are launched, you can verify that the initial LDES'es are empty:
```bash
curl http://localhost:8072/device-models-by-time
curl http://localhost:8071/devices-by-time
curl http://localhost:8073/water-quality-observations-by-time
```
returns (differently formatted):
```
@prefix tree: <https://w3id.org/tree#> .
<http://localhost:8072/device-models-by-time> a tree:Node .

@prefix tree: <https://w3id.org/tree#> .
<http://localhost:8071/devices-by-time> a tree:Node .

@prefix tree: <https://w3id.org/tree#> .
<http://localhost:8073/water-quality-observations-by-time> a tree:Node .
```

## Test Execution
In order to execute the test, you need to load & configure a workflow and send some test data.

### Load & Configure Workflow
Please logon to the Apache Nifi system at https://localhost:8443/nifi and add the [workflow](./nifi-workflow.json) (see [here](../../../support/context/workflow/README.md#creating-a-workflow) for details).

Note that the workflow contains several warnings because the JOLT processors are (deliberately) missing a transformation specification. Please add the provided JOLT specifications for [models](./data/transforms/device-model.jolt-transform.json), [devices](./data/transforms/device.jolt-transform.json) and water quality [observations](./data/transforms/wqo.jolt-transform.json) into the correct JOLT processor's `Jolt Specification` property.

In addition, for the observations you need to add the [JOLT specification to add a WKT](./data/transforms/asWkt.jolt-transform.json) as the OSLO model can not handle geojson.

Start the workflow and verify that the workflow's HTTP listeners are ready to accept entities.
* http://localhost:9013/ngsi/device-model/healthcheck
* http://localhost:9012/ngsi/device/healthcheck
* http://localhost:9014/ngsi/water-quality-observed/healthcheck

### Send Test Data
To send a test model and a test device execute the following commands:
```bash
curl -X POST http://localhost:9013/ngsi/device-model -H 'Content-Type: application/json' -d '@data/device-model.json' 
curl -X POST http://localhost:9012/ngsi/device -H 'Content-Type: application/json' -d '@data/device.json' 
```

To send a few water quality observations, briefly start the observations generator (type `CTRL-C` to stop it):
```bash
docker compose --env-file user.env up json-data-generator
```

## Test Validation
To validate that the LDES'es contain the correct OSLO models, you can retrieve the LDES views and follow the relations.
```bash
curl http://localhost:8072/device-models-by-time
curl http://localhost:8071/devices-by-time
curl http://localhost:8073/water-quality-observations-by-time
```

## Test Cleanup
To clean up the test, please stop all systems:
```bash
docker compose --env-file user.env down
docker compose --env-file user.env --profile delay-started down
```

If needed, remove the database files in your `MONGODB_DATA_FOLDER` location.
