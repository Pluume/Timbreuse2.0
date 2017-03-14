#!/bin/bash
rsync  --progress -az /media/sf_Working /root/ --exclude 'dev' --exclude 'CSV' --exclude 'config.json' --exclude 'Timbreuse.log'
