#!/bin/sh
NODE=/usr/bin/node
PORT=${1-8888}
[ -x /usr/bin/nodejs ] && NODE=/usr/bin/nodejs
nohup $NODE subopt.js $PORT </dev/null >runsubopt.log 2>&1 &
sleep 1
cat runsubopt.log
