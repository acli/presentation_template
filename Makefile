all: example_files/29_The_National_Anthem_-_God_Save_The_Queen_(ARR_JACOB).ogv \
	example_files/Parlement_discours-du_trone.jpg \
	example_files/Sanikiluaq_peneplain.jpg \

example_files/29_The_National_Anthem_-_God_Save_The_Queen_(ARR_JACOB).ogv:
	mkdir -p example_files
	wget -O '$@' 'https://archive.org/download/QueenElizabethIIDiamondJubileeCoronationConcert/29%20The%20National%20Anthem%20-%20God%20Save%20The%20Queen%20%28ARR%20JACOB%29.ogv'

example_files/Sanikiluaq_peneplain.jpg:
	mkdir -p example_files
	wget -O '$@' 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Sanikiluaq_peneplain.JPG?download'

example_files/Parlement_discours-du_trone.jpg:
	mkdir -p example_files
	wget -O '$@' 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Parlement_discours-du_tr%C3%B4ne.jpg'

.PHONEY: all
.DELETE_ON_ERROR:
