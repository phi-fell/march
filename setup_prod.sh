#!/bin/bash
mkdir bugs
mkdir users
mkdir world
mkdir config
echo "{\"hash\":\"master\",\"rebuild\":false}" > config/launch.json

mkdir admin
echo please enter an admin token: 
read token
printf $token > admin/token

echo please enter an SSL certificate root directory:
read ssl_root
echo please enter an SSL private key filename \(optional\):
read ssl_key
echo please enter an SSL certificate filename \(optional\):
read ssl_cert
json='{"root": "'"${ssl_root:-/etc/letsencrypt/live/gotg.io/}"'", "key": "'"${ssl_key:-privkey.pem}"'", "cert": "'"${ssl_cert:-cert.pem}"'"}'
printf $json > config/https.json

npm install
tmux new -d -s node_march
tmux send-keys -t node_march.0 "npm run prod" ENTER
tmux a -t node_march
