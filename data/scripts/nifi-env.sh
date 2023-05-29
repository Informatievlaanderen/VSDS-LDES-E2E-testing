#!/bin/sh
scripts_dir='/opt/nifi/scripts'
[ -f "${scripts_dir}/common.sh" ] && . "${scripts_dir}/common.sh"
prop_replace 'nifi.content.repository.archive.enabled' 'false'
