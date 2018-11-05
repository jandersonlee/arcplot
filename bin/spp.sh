#!/bin/sh
TMP=/tmp/tmp$$.txt
echo "$@" >> /tmp/spp.log
../bin/spp "$@" > $TMP 2>>/tmp/spp.log
cat $TMP
rm -f $TMP
