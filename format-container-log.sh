#!/bin/bash
name=$(docker container inspect --format {{.Name}} $@)
echo ::group::${name:1}
docker logs $@
echo ::endgroup::
echo
