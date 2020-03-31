#!/bin/bash

if [ $# -eq 1 ]
  then
    git checkout master
    git fetch origin
    git reset --hard origin/master
    git checkout -b "$1"
    git push -u origin "$1"
else
    echo "The branch needs a name!"
fi
