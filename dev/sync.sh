#!/bin/bash
rsync -az /media/sf_Working /root/ --exclude 'dev' --exclude 'CSV' --exclude 'config.json' --exclude 'Timbreuse.log' --progress
