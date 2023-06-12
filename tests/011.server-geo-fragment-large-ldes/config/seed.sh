#!/bin/sh
curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d '@./connections.ttl'
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams/connections/views' -H 'Content-Type: text/turtle' -d '@./connections.by-location-and-time.ttl'
if [ $? != 0 ] 
    then exit $? 
fi
