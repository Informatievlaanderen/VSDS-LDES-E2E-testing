#!/bin/bash
name=$(docker container inspect --format {{.Name}} $@)
echo ::group::${name:1}
docker logs -t -n 1000 $@
echo ::endgroup::
echo
