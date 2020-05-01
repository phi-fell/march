#!/bin/bash
mkdir bugs
mkdir users
mkdir world
mkdir config
echo "{\"hash\":\"master\",\"rebuild\":false}" > config/launch.json

mkdir admin
echo please enter an admin token: 
read token
printf "$token" > admin/token

echo please enter an SSL certificate root directory:
read ssl_root
echo please enter an SSL private key filename \(optional\):
read ssl_key
echo please enter an SSL certificate filename \(optional\):
read ssl_cert
default_root="/etc/letsencrypt/live/gotg.io/"
default_key="privkey.pem"
default_cert="cert.pem"
json='{"root": "'"${ssl_root:-$default_root}"'", "key": "'"${ssl_key:-$default_key}"'", "cert": "'"${ssl_cert:-$default_cert}"'"}'
printf "$json" > config/https.json

npm install
tmux new -d -s node_march
tmux send-keys -t node_march.0 "npm run prod" ENTER
tmux a -t node_march
