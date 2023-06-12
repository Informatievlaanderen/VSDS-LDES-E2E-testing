#!/bin/sh
curl -X POST 'http://localhost:8081/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d '@./devices.ttl'
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8081/admin/api/v1/eventstreams/devices/views' -H 'Content-Type: text/turtle' -d '@./devices.by-page.ttl'
if [ $? != 0 ] 
    then exit $? 
fi
