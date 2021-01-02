
These are the files I cobbled up some time in May 2017 for projecting song lyrics.
(There have been minor changes since 2017.)
The layout was designed so that in a medium-sized meeting room,
people at the back row should be able to see the current verse on the top of the screen
even if there are people in front of you blocking the lower part of the projection.

As this was designed specifically for lyrics,
this might not be appropriate for other types of texts,
but since this is just HTML+CSS+Javascript it should not be too hard to adapt it.

There was a fancier, older version of the template but I’ve already forgotten where I put it.

Navigation
==========

The Javascript uses a vaguely vi-like keyboard-based navigation
(`h`, `l` to advance/go back, `H` to home, etc., so this isn’t WCAG-compliant),
but up and down arrow keys also work.
Pressing `?` will bring up a summary of the keys.

An audio source can be specified for each slide (i.e., `section`).

Example file
============

If you would like to hear audio in the example (`z` key on the two lyrics slides),
please download the video of
[*God Save The Queen* from the Queen Elizabeth II Diamond Jubilee Coronation Concert](https://archive.org/details/QueenElizabethIIDiamondJubileeCoronationConcert/29+The+National+Anthem+-+God+Save+The+Queen+(ARR+JACOB).mpg)
from the Internet Archives by running `make`.
If you do not have a local copy of the video the `z` key will auto-advance without audio.




