# LDES Server Caching
An [LDES Server](https://github.com/Informatievlaanderen/VSDS-LDESServer4J) allows to ingest version objects, which is essentially an immutable version of an object's state, to create one or more views on these LDES members and to retrieve them using fragments of such a view. The LDES Server can be configured to serve the collection of LDES members using a collection name of choice as well as a number of views which can also be named freely. When requesting the LDES itself the LDES Server returns information about the collection as well as information about the available view(s). When requesting a view the LDES Server returns information about the view itself and a link to the first fragment from where the complete collection of LDES members can be retrieved. 

Because an LDES contains version objects, the collection can consist of a huge number of LDES members. Serving the whole collection in one response is obviously not possible, therefore each fragment contains a limited number of LDES members and a number of links to other fragments from where more LDES members can be retrieved. An LDES Server allows to configure this LDES members limit per fragment. When a fragment contains this maximum amount of LDES members and no more fragment links will be added, it can be marked as immutable. This allows the fragment to be cached on a reverse proxy or load balancer to allow for better scaling. Note that an LDES collection will change over time as new version objects are ingested and therefore some fragments (e.g. incomplete) will not be marked as immutable but rather marked as temporary cacheable to better handle the load of the LDES server.

This demo shows the mechanisms provided in the LDES server to allow for ingesting LDES members, as well as serving and caching LDES fragments. In particular, we demonstrate the follow features:
* configuring the collection and view names
* configuring the fragment member limit
* configuring the cache time for fragments
* accepted member formats on ingest
* accepted fragment formats on request
* supported CORS and http verbs (preflight)
* supported caching features (etag, max-age, immutable, etc.)
* use [nginx](https://nginx.org/) (pronounced 'Engine-X') as cache server
* use nginx for compression of RDF types
* ability of the LDES client to handle http 304 (not modified)

## Test Setup
To demonstrate the above features we use a number of Docker containers as part of a [context](./docker-compose.yml), more specific an LDES Server with a MongoDB for its storage and an nginx [configured](./nginx.conf) to show the cacheability capabilities.

The Docker compose context is setup to require a minimal set of settings. You need to copy the default environment [file](./setup-caching.env) to a user file (i.e. `user.env`) so you can configure these required settings and optionally change some other settings to tailor the systems to your needs.

Required settings:
* MONGODB_DATA_FOLDER (local directory for storing the mongoDB database)

You can also change the following optional settings to tune the LDES Server as you see fit:
* COLLECTION_NAME (base URL for ingesting/serving the collection, default: `mobility-hindrances`)
* VIEW_NAME (name of the view, used for serving the view, default: `by-time`)
* MEMBER_LIMIT (maximum number of members per fragment, default: `2`)
* MAX_AGE (mutable time-to-live, allowed cache time in seconds for mutable fragments, default: `60`)
* MAX_AGE_IMMUTABLE (immutable time-to-live, allowed cache time in seconds for immutable fragments, default: `604800`)

## Test Execution and Verification
> **Note** that we use a **bash shell** for executing all commands in this demo. In particular a PowerShell terminal *does not have* a compatible [curl](https://curl.se/) command. On windows, please use a [git](https://git-scm.com/downloads/win) bash, a [Mingw-w64](https://www.mingw-w64.org/) environment, a [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) etc.

To start all the systems in the context execute the following command:
```bash
docker compose --env-file user.env up
```

### Verify URL Naming Strategy
As shown in the [test setup](#test-setup) the LDES Server allows to specify the collection name and the view name. Based on these configurable settings, the LDES server will accept requests on the URL `http://localhost:8080/<ldes-name>/<view-name>`. E.g. if you keep the default settings, the collection is available at http://localhost:8080/mobility-hindrances and the view at http://localhost:8080/mobility-hindrances/by-time, or using bash commands:
```bash
curl http://localhost:8080/mobility-hindrances
curl http://localhost:8080/mobility-hindrances/by-time
```
this results in:
```
@prefix ldes:                <https://w3id.org/ldes#> .
@prefix mobility-hindrances: <https://private-api.gipod.test-vlaanderen.be/api/v1/ldes/mobility-hindrances/> .
@prefix tree:                <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances>
        a           ldes:EventStream ;
        tree:shape  mobility-hindrances:shape ;
        tree:view   <http://localhost:8080/mobility-hindrances/by-time> .
```
and
```
@prefix tree: <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances/by-time>
        a       tree:Node .
```

### Verify Acceptable Fragment Formats
The LDES Server allows to request the collection (including the views and fragments) as the following formats: N-triples, N-quads, Turtle and JSON-LD.
> **Note** that you can use `-H` or `--header` which is equivalent.
```
curl -H "accept: text/turtle" http://localhost:8080/mobility-hindrances/by-time
curl -H "accept: application/n-quads" http://localhost:8080/mobility-hindrances/by-time
curl -H "accept: application/ld+json" http://localhost:8080/mobility-hindrances/by-time
curl -H "accept: application/n-triples" http://localhost:8080/mobility-hindrances/by-time
```
this results in:
```
@prefix tree: <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances/by-time>
        a       tree:Node .
```
```
<http://localhost:8080/mobility-hindrances/by-time> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/tree#Node> .
```
```
{
    "@id": "http://localhost:8080/mobility-hindrances/by-time",
    "@type": "tree:Node",
    "@context": {
        "tree": "https://w3id.org/tree#"
    }
}
```
```
(empty response)
```
(**bug**: retrieving n-triples fails, see https://github.com/Informatievlaanderen/VSDS-LDESServer4J/issues/357)

### Verify Acceptable Member Formats
The LDES Server allows to ingest the following RDF formats: N-triples, N-quads, Turtle and JSON-LD.
> **Note** that you can use `-i` or `--include`, `-X` or `--request`, `-d` or `--data` which are pairwise equivalent.
```
curl -i -X POST http://localhost:8080/mobility-hindrances -H 'Content-Type: text/turtle' -d '@data/member.ttl'
curl -i -X POST http://localhost:8080/mobility-hindrances -H 'Content-Type: application/n-quads' -d '@data/member.nq'
curl -i -X POST http://localhost:8080/mobility-hindrances -H 'Content-Type: application/ld+json' -d '@data/member.jsonld'
curl -i -X POST http://localhost:8080/mobility-hindrances -H 'Content-Type: application/n-triples' -d '@data/member.nt'
```
this results in:
```
HTTP/1.1 100 

HTTP/1.1 415 
Accept: application/n-quads, application/n-triples, application/ld+json
Content-Length: 0
Date: Wed, 28 Dec 2022 16:23:07 GMT
Connection: close
```
(**bug**: cannot ingest turtle format, see https://github.com/Informatievlaanderen/VSDS-LDESServer4J/issues/355)
```
HTTP/1.1 100 

HTTP/1.1 200 
Content-Length: 0
Date: Wed, 28 Dec 2022 16:23:07 GMT
```
```
HTTP/1.1 100 

HTTP/1.1 200 
Content-Length: 0
Date: Wed, 28 Dec 2022 16:23:07 GMT
```
```
HTTP/1.1 100 

HTTP/1.1 200 
Content-Length: 0
Date: Wed, 28 Dec 2022 16:23:07 GMT
```

### Verify CORS and Suppored HTTP Verbs
The LDES Server is setup to accept requests from anywhere and, if needed, access should be restricted in another way. You can easily verify CORS using:
```bash
curl -i -X OPTIONS -H "Origin: http://www.example.com" -H "Access-Control-Request-Method: GET" http://localhost:8080/mobility-hindrances/by-time
```
this results in:
```
HTTP/1.1 200 
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Max-Age: 1800
Allow: GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH
Content-Length: 0
Date: Wed, 28 Dec 2022 16:33:01 GMT
```
In the above response we notice that the allowed HTTP verbs also include HEAD. You can verify this using:
> **Note** that you can use `-I` or `--head` which are equivalent.
```bash
curl -I http://localhost:8080/mobility-hindrances/by-time
```
which results in:
```
HTTP/1.1 200 
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Cache-Control: public,max-age=60
Content-Disposition: inline
ETag: "4a1601b633847b2fb88527e39ad55bd14663ea95a6ed62ae4f2aa5fca8faf6aa"
Content-Type: text/turtle
Transfer-Encoding: chunked
Date: Wed, 28 Dec 2022 16:42:53 GMT
```
> **Note** that the fragment information also includes an `ETag` which can be used by the nginx for caching purposes.

### Verify Caching Features
To verify which caching features the LDES Server provides you can use:
```bash
curl -I http://localhost:8080/mobility-hindrances/by-time
```
this results in:
```
HTTP/1.1 200 
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Cache-Control: public,max-age=60
Content-Disposition: inline
ETag: "4a1601b633847b2fb88527e39ad55bd14663ea95a6ed62ae4f2aa5fca8faf6aa"
Content-Type: text/turtle
Transfer-Encoding: chunked
Date: Wed, 28 Dec 2022 16:58:16 GMT
```
Notice that the headers include `Cache-Control: public,max-age=60` which indicates that the response can be cached (publicly) for a duration of 60 seconds. In addition the header `ETag: "4a1601b633847b2fb88527e39ad55bd14663ea95a6ed62ae4f2aa5fca8faf6aa"` defines a unique hash which can be used to verify that the content did not change, using `--head` or `-I` which do not request the content, only the headers.

### Verify Actual Caching
The above caching features allow to setup nginx (or another system) as a caching server for the LDES Server. The nginx [configuration](./nginx.conf) is setup as a proxy server for the LDES server and with a cache named `static-cache` which stores the responses for any HTTP verb for 60 minutes. In addition it adds a `X-Cache-Status` header to its responses to indicate a cache `Hit` or `Miss`. 

The nginx server is configured to listen to http://localhost:8080 by default, configurable in your `user.env`. The nginx server will forward any request to the LDES server and forward its response to the requester. However, because it is setup for caching, it will first verify if it does not have a response cached for the incoming request and, if so, return the response from cache. You can verify this by requesting a fragment twice:
```bash
curl -i http://localhost:8080/mobility-hindrances/by-time
```
initially results in:
```
HTTP/1.1 200 
Server: nginx/1.23.3
Date: Wed, 28 Dec 2022 17:20:30 GMT
Content-Type: text/turtle
Transfer-Encoding: chunked
Connection: keep-alive
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Cache-Control: public,max-age=60
Content-Disposition: inline
ETag: "4a1601b633847b2fb88527e39ad55bd14663ea95a6ed62ae4f2aa5fca8faf6aa"
X-Cache-Status: MISS

@prefix tree: <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances/by-time>
        a              tree:Node ;
        tree:relation  [ a          tree:Relation ;
                         tree:node  <http://localhost:8080/mobility-hindrances/by-time?generatedAtTime=2022-12-28T15:25:45.468Z>
                       ] .
```
When re-requested:
```bash
curl -i http://localhost:8080/mobility-hindrances/by-time
```
the result is:
```
HTTP/1.1 200 
Server: nginx/1.23.3
Date: Wed, 28 Dec 2022 17:20:57 GMT
Content-Type: text/turtle
Transfer-Encoding: chunked
Connection: keep-alive
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Cache-Control: public,max-age=60
Content-Disposition: inline
ETag: "4a1601b633847b2fb88527e39ad55bd14663ea95a6ed62ae4f2aa5fca8faf6aa"
X-Cache-Status: HIT

@prefix tree: <https://w3id.org/tree#> .

<http://localhost:8080/mobility-hindrances/by-time>
        a              tree:Node ;
        tree:relation  [ a          tree:Relation ;
                         tree:node  <http://localhost:8080/mobility-hindrances/by-time?generatedAtTime=2022-12-28T15:25:45.468Z>
                       ] .
```
Notice that the cache did not contain a cached response the first time (`X-Cache-Status: MISS`) but it did the second time (`X-Cache-Status: HIT`).

### Verify Nginx Compression Setup
The RDF file formats are rather verbose and therefore may benefit from compression during network transport. For this reason we have [configured](./nginx.conf) our nginx server to do gzip compression (`gzip on`) for the supported RDF types (`gzip_types application/n-triples application/ld+json text/turtle application/n-quads`) and switched it on (`gzip_static on`) for all forwarded requests. We can easily verify this if we request compression:
```bash
curl -I -H "Accept-Encoding: gzip" http://localhost:8080/mobility-hindrances/by-time
```
which results in:
```
HTTP/1.1 200 
Server: nginx/1.23.3
Date: Wed, 28 Dec 2022 17:47:37 GMT
Content-Type: text/turtle
Connection: keep-alive
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Cache-Control: public,max-age=60
Content-Disposition: inline
ETag: W/"802756eadd0892271b5d7b19b86843191eb4be9198a5a9595bd5faae19db73b5"
X-Cache-Status: MISS
Content-Encoding: gzip
```
Notice the presence of the header `Content-Encoding: gzip` which indicates that the content is compressed using gzip. If we request the content, curl will warn us about the compressed, binary content:
```bash
curl -H "Accept-Encoding: gzip" http://localhost:8080/mobility-hindrances/by-time
```
results in:
```
Warning: Binary output can mess up your terminal. Use "--output -" to tell 
Warning: curl to output it to your terminal anyway, or consider "--output 
Warning: <FILE>" to save to a file.
```
if we do this:
```bash
curl -H "Accept-Encoding: gzip" http://localhost:8080/mobility-hindrances/by-time --output view.ttl.gz
```
we receive the file and see:
```
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   121    0   121    0     0  12100      0 --:--:-- --:--:-- --:--:-- 13444
```
We can use the following command to unzip it:
```bash
gzip -d view.ttl.gz
```
which results in a [turtle file](./view.ttl).

### Verify HTTP 304 Handling
To launch the LDES client and follow its behavior run the following command:
```bash
docker compose --env-file user.env up ldes-cli
```
> **NOTE**: it is not yet possible to validate that the HTTP 304 (Not Modified) header is correctly handled by the LDES client. The behavior is implemented but not yet logged. We are adding logging to the LDES client so very soon this will be available.

## Test Teardown
Stop all systems, i.e.:
```bash
docker compose --env-file user.env --profile delay-started down
docker compose --env-file user.env down
```
