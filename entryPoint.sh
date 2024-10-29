#!/bin/bash

if [ "$#" -eq 0 ]; then
    echo "Running default command..."
    exec node server.js
else
    echo "Running with arguments: $@"
    exec node logParser.js "$@"
fi