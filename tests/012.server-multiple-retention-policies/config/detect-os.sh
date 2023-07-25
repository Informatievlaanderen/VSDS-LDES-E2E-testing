#!/bin/bash
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "linux";
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "mac";
elif [[ "$OSTYPE" == "cygwin" ]]; then
    echo "windows";
elif [[ "$OSTYPE" == "msys" ]]; then
    echo "windows";
else
    echo "unknown";
fi
