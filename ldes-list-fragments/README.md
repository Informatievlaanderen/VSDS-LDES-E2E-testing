# List LDES Fragments
This small tool allows to follow an LDES view and all of its related fragments and list them to the console output. This allows to verify which fragments an LDES view currently contains as well as follow the LDES view for new fragments.

The tool makes a HTTP(S) request to retrieve the view (first fragment). It determines the fragment ID and sends it to the console output. Then, it searches the fragment for all related fragments and schedules each fragment for retrieval (unless already retrieved). If a fragment is marked as expiring (`Cache-Control` header contains a `(s-)max-age` and is not marked as `immutable`) it is re-requested after the expiration time.

## Docker
The tool can be run as a Docker container, using a pre-built container or after creating a Docker image for it locally. The Docker container will keep running until stopped.

To create a Docker image, run the following command:
```bash
docker build --tag vsds/ldes-list-fragments .
```

To run the Docker image mapped and follow an LDES view, you can run it interactively, e.g.:
```bash
docker run --rm -it \
-e FOLLOW=https://gipod.smartdataspace.dev-vlaanderen.be/mobility-hindrances-timebased \
vsds/ldes-list-fragments:latest
```

All available environment variables are (see [below](#run) for details):
* `FOLLOW` (mandatory)
* `SILENT` (optional)
* `MIME_TYPE` (optional)
* `POLL_INTERVAL` (optional)

## Build
The tool is implemented as a [Node.js](https://nodejs.org/en/) application.
You need to run the following commands to build it:
```bash
npm install
npm run build
```

## Run
The tool takes the following command line arguments:
* `--follow=<view-url>` URL of the LDES view to follow, no default
* `--silent=<true|false>` prevents any console debug output if true, defaults to `true` (silent, not logging debug info)
* `--mime-type=<mime-type>` the mime-type to use when requesting a fragment, defaults to `application/n-quads`
* `--poll-interval=<millis>` the interval in milliseconds to wait before verifying if any fragment has expired, defaults to `1000` (1 second)

You can run the tool providing the mandatory view URL (and one or more optional arguments) after building it, e.g.:
```bash
node dist/index.js  --silent false --mime-type "text/turtle" --poll-interval 30000 \
--follow https://gipod.smartdataspace.dev-vlaanderen.be/mobility-hindrances-timebased
```
