#!/bin/sh
curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d '@./mobility-hindrances.ttl'
if [ $? != 0 ] 
    then exit $? 
fi

curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams/mobility-hindrances/views' -H 'Content-Type: text/turtle' -d '@./mobility-hindrances.paged.ttl'
if [ $? != 0 ] 
    then exit $? 
fi
