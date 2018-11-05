#!/bin/sh
TMP=/tmp/tmp$$.gif
../bin/dpfe "$@" > $TMP
#echo Content-Type: text/plain
#echo Content-Length: `wc --bytes $TMP`
#echo 
cat $TMP
rm -f $TMP
