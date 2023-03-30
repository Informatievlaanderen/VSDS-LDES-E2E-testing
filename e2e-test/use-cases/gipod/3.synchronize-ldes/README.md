# LDES Client Can Synchronize an LDES
This test validates user story **As a data intermediary I want to keep in sync with changes in the GIPOD LDES data set.** (VSDSPUB-60) and was shown during demo 1 on June, 7th 2022.

The test verifies that the LDES Client can synchronize a (small subset of the) GIPOD data set, after replication. It uses a context containing a (LDES Server) simulator serving the fragments, a workflow containing the LDES Client and a http sender and a message sink backed by a data store (mongodb).

For this test we use a data set containing three fragments in the initial set (for the replication part):
* `alfa.jsonld` (250 items)
* `beta.jsonld` (250 items)
* `gamma.jsonld` (1 item)

In addition, we use two file that allow us to update the last fragment (synchronization):
* `delta.jsonld` (50 items - adds 49 new members to `gamma.jsonld`)
* `epsilon.jsonld` (117 items - adds 67 new members to `delta.jsonld`)

We need to upload all but the last fragment as an immutable fragment and the last fragment with a freshness indication of N seconds (see [max-age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#response_directives)). This will ensure that the LDEs client retrieves the first two fragments only once and the last one repeatedly, every N seconds.

## Test Setup
> **Note**: if needed, copy the [environment file (.env)](./.env) to a personal file (e.g. `user.env`) and change the settings as needed. If you do, you need to add ` --env-file user.env` to each `docker compose` command.

1. Run all systems except the workflow by executing the following (bash) command:
```bash
docker compose up -d
```

2. Seed the initial data set and [alias it](./create-alias.json)
```bash
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/alfa.jsonld'
curl -X POST http://localhost:9011/ldes -H 'Content-Type: application/ld+json' -d '@data/beta.jsonld'
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/ld+json' -d '@data/gamma.jsonld'
curl -X POST http://localhost:9011/alias -H "Content-Type: application/json" -d '@create-alias.json'
```
**Note** the `?max-age=10` part in the last command limiting the freshness to 10 seconds.

The simulator (http://localhost:9011) will respond with:
```json
{"content-type":"application/ld+json","cache-control":"public, max-age=604800, immutable","id":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-20T09:58:15.867Z"}
{"content-type":"application/ld+json","cache-control":"public, max-age=604800, immutable","id":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-05-25T10:22:45.82Z"}
{"content-type":"application/ld+json","cache-control":"public, max-age=10","id":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2022-06-03T07:58:29.2Z"}
```
**Note** the `"cache-control":"public, max-age=604800, immutable"` for the first two fragments and the `"cache-control":"public, max-age=10"` for the last one.

3. Start the workflow containing the LDES Client
```bash
docker compose up ldio-workflow -d
```

4. Verify that all members are received by the [sink](http://localhost:9003/) (execute repeatedly):
```bash
curl http://localhost:9003/
```
**Note** that after a short while the result should be (alfa + beta + gamma):
```json
{"count":501}
```

5. Verify that last fragment is re-requested on a regular interval (definied by the amount of seconds in the `?max-age=10` part when uploading it, i.e. every 10 seconds) but no members are sent to the sink HTTP server (execute repeatedly):
```bash
curl http://localhost:9011/
curl http://localhost:9003/
```

## Test Execution
This part verifies that the *synchronization* works after the initial data set is *replicated*.

1. Seed a data set update.
```bash
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/ld+json' -d '@data/delta.jsonld'
```

2. Verify update received (execute repeatedly):
```bash
curl http://localhost:9003/
```
**Note** that after a short while the result should be (alfa + beta + delta):
```json
{"count":550}
```

3. Seed another data set update:
```bash
curl -X POST http://localhost:9011/ldes?max-age=10 -H 'Content-Type: application/ld+json' -d '@data/epsilon.jsonld'
```

4. Verify that synchronization happens correctly (execute repeatedly):
```bash
curl http://localhost:9003/
```
**Note** that after a short while the result should be (alfa + beta + epsilon):
```json
{"count":617}
```

## Test Teardown
To stop all systems use:
```bash
docker compose stop ldio-workflow
docker compose --profile delay-started down
```
