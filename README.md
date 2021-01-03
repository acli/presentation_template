
These are the files I cobbled up some time in May 2017 for projecting song lyrics.
(There have been minor changes since 2017.)
The layout was designed so that in a medium-sized meeting room,
people at the back row should be able to see the current verse on the top of the screen
even if there are people in front of you blocking the lower part of the projection.

As this was designed specifically for lyrics,
this might not be appropriate for other types of texts,
but since this is just HTML+CSS+Javascript it should not be too hard to adapt it.

There was a fancier, older version of the template but I’ve already forgotten where I put it.

Running a presentation
==========

The Javascript interface uses a vaguely *vi*-like keyboard-based navigation
(`h`, `l` to advance/go back, `H` to home, etc., so this isn’t WCAG-compliant),
but up and down arrow keys also work.
Pressing `?` will bring up a summary of the keys.

The interface treats slides like lines,
so hit `h` to advance,
`l` to go back,
`0` to go back to the beginning of the slide,
`j` for next slide, etc.
Marking commands (`m`, `G`, `'`) should also work.

The non-vi commands are:
* `z`: start auto-advance (if timings are encoded in the slide) and play audio if provided
* `Z`: stop auto-advance (but keep audio playing)
* `X`: stop audio
* `p`: play softer
* `f`: play louder


Example file
============

To run the example, open [example.html] in a browser.
Hit the down arrow to advance.
On lyrics slides you can use down arrow,
which would be how you’d use it if there’s a live band so you’re advancing the slide by hand;
alternatively you can hit the `z` key to auto-advance the slide.

The auto-advance that you get when you hit `z` is synced to 
[God Save The Queen on the *Queen Elizabeth II Diamond Jubilee Coronation Concert*](https://archive.org/details/QueenElizabethIIDiamondJubileeCoronationConcert/29+The+National+Anthem+-+God+Save+The+Queen+(ARR+JACOB).mpg).
If you would like to hear actual audio,
please download the video clip of the performance
from the Internet Archives by running `make`
(`gmake` on a BSD system).
If you do not have a local copy of the video the `z` key will auto-advance without audio.

The `make` command will also download two photos from Wikimedia Commons –
these are used on the lyrics slides to demonstrate how to embed background images.




