#!/bin/sh
curl -X POST 'http://localhost:8080/admin/api/v1/eventstreams' -H 'Content-Type: text/turtle' -d '@./mobility-hindrances.ttl'
if [ $? != 0 ] 
    then exit $? 
fi
