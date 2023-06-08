#!/bin/sh
curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d '@./addresses.ttl'
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams/addresses/views' -H 'Content-Type: text/turtle' -d '@./addresses.by-name.ttl'
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams/addresses/views' -H 'Content-Type: text/turtle' -d '@./addresses.by-time.ttl'
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams/addresses/views' -H 'Content-Type: text/turtle' -d '@./addresses.by-location-and-time.ttl'
if [ $? != 0 ] 
    then exit $? 
fi
