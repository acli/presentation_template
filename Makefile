all: example_files/29_The_National_Anthem_-_God_Save_The_Queen_(ARR_JACOB).ogv

example_files/29_The_National_Anthem_-_God_Save_The_Queen_(ARR_JACOB).ogv:
	mkdir -p example_files
	wget -O '$@' 'https://archive.org/download/QueenElizabethIIDiamondJubileeCoronationConcert/29%20The%20National%20Anthem%20-%20God%20Save%20The%20Queen%20%28ARR%20JACOB%29.ogv'

.PHONEY: all
.DELETE_ON_ERROR:
