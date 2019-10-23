#!/bin/bash
mkdir bugs
mkdir users
mkdir players
mkdir world
mkdir config
echo "{\"hash\":\"master\",\"rebuild\":false}" > config/launch.json
mkdir admin
echo please enter an admin token: 
read token
printf $token > admin/token
npm install
tmux new -d -s node_march
tmux send-keys -t node_march.0 "npm run prod" ENTER
tmux a -t node_march
