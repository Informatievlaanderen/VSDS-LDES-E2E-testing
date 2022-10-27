# TODO: write README file

Steps to document:

1. setup docker environment
```bash
export COMPOSE_FILE="../3.ngsi-v2-to-ldes/docker-compose.yml"
```
2. start all but observations generator
```bash
docker compose --env-file env.user up
```
3. check (empty) LDES'es
```bash
curl http://localhost:8072/device-models-by-time
curl http://localhost:8071/devices-by-time
curl http://localhost:8073/water-quality-observations-by-time
```
4. logon and add workflow

Logon at https://localhost:8443/nifi & add [workflow](./nifi-workflow.json)

5. configure OSLO transformations and start workflow

Insert the JOLT transforms for [model](./data/transforms/device-model.jolt-transform.json), [device](./data/transforms/device.jolt-transform.json) & [WQO](./data/transforms/wqo.jolt-transform.json) and start workflow.

6. check workflow is ready to accept entities

Verify that the HTTP listeners are working: they should answer `OK`.
* http://localhost:9013/ngsi/device-model/healthcheck
* http://localhost:9012/ngsi/device/healthcheck
* http://localhost:9014/ngsi/water-quality-observed/healthcheck

7. send test model and device

```bash
curl -X POST http://localhost:9013/ngsi/device-model -H 'Content-Type: application/json' -d '@data/device-model.json' 
curl -X POST http://localhost:9012/ngsi/device -H 'Content-Type: application/json' -d '@data/device.json' 
```

8. (briefly) start observations generator
```bash
docker compose --env-file env.user up json-data-generator
```

9. validate LDES'es
```bash
curl http://localhost:8072/device-models-by-time
curl http://localhost:8071/devices-by-time
curl http://localhost:8073/water-quality-observations-by-time
```

10. stop all systems
```bash
docker compose --env-file env.user down
```
