#export GPU_FORCE_64BIT_PTR=0
#export GPU_MAX_HEAP_SIZE=100
export GPU_USE_SYNC_OBJECTS=1
export GPU_MAX_ALLOC_PERCENT=100
#export GPU_SINGLE_ALLOC_PERCENT=100

/home/min/mining/bin/claymore/ethdcrminer64 \
	-epool eu1.ethermine.org:4444 -ewal 0x58ef706de61f78b33641cbdce14e61f5eec247f4.rig2 -epsw x \
	-wd 1 \
	-logfile /home/min/mining/claymore-log-file.txt

#       -dpool stratum+tcp://dcr.suprnova.cc:2252 -dwal rover987.rig1 -dpsw 34fkdSv782 \
#       -allpools 1 \