#!/bin/bash
CWD=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")
docker compose rm -s -f -v ldio-workbench
docker compose down
rm -f $CWD/count.csv
rm -f $CWD/name.csv

