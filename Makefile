all: example_files/29_The_National_Anthem_-_God_Save_The_Queen_(ARR_JACOB).ogv

example_files/29_The_National_Anthem_-_God_Save_The_Queen_(ARR_JACOB).ogv:
	mkdir -p example_files
	wget -O '29_The_National_Anthem_-_God_Save_The_Queen_(ARR_JACOB).ogv' $@

.PHONEY: all
.DELETE_ON_ERROR:
