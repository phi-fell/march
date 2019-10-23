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
