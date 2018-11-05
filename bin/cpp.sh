#!/bin/sh
TMP=/tmp/tmp$$.txt
echo "$@" >> /tmp/cpp.log 2>/dev/null
#echo Content-Type: text/plain
#echo Content-Length: `wc --bytes $TMP`
#echo 
../bin/cpp "$@"
