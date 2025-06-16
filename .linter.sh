#!/bin/bash
cd /home/kavia/workspace/code-generation/quadmatch-57243-417ce2a6/quadmatch
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

