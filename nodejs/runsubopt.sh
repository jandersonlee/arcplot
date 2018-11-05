#!/bin/sh
NODE=/usr/bin/node
[ -x /usr/bin/nodejs ] && NODE=/usr/bin/nodejs
nohup $NODE subopt.js </dev/null >runsubopt.log 2>&1 &
sleep 1
cat runsubopt.log
