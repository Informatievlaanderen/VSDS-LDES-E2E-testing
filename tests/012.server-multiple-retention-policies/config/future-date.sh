#!/bin/bash
export SCRIPT_PATH=$(dirname -- "$( readlink -f -- "${BASH_SOURCE:-$0}"; )")
OS=$($SCRIPT_PATH/detect-os.sh)

if [[ "$OS" == "linux" ]]; then
    echo $(date -u -d "$@ seconds" +"%Y-%m-%dT%H:%M:%S");
elif [[ "$OS" == "mac" ]]; then
    echo $(date -u -Iseconds -v +$@S);
elif [[ "$OS" == "windows" ]]; then
    echo "TODO";
else
    echo "";
fi