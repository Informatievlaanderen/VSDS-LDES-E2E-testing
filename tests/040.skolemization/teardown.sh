#!/bin/bash
CWD=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")
docker compose down
rm $CWD/page.nt
