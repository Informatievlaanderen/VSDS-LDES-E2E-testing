#!/bin/sh
curl --silent --fail --insecure --head "https://$HOSTNAME:8443/nifi-api/access"
exit $?
