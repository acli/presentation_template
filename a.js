/* vi: set sw=4 ai sm: */
/*
 * © 2016–2021 Ambrose Li
 * This is part of the four auxiliary files (a.css, a.js, jquery, reset.css) required by the HTML slides
 * Written by Ambrose Li c. June 2016 for Carmel Fellowship, SCBC
 * Auto-advance re-implemented by Ambrose Li, July 2018
 * Audio support re-implemented by Ambrose Li, January 2020
 */

cursor = 0;
blocks = [];
backref = {};
sections = [];
sections_backref = {};
r1 = 0;
prev = 0;
markers = {};
marking = false;
recalling = false;
volume = 50;

// Auto-advance state variables
timer_pid = false;
t = false;

function remove_unused_items () {
    $('.unused').remove();
} /* remove_unused_items */

function find_blocks () {
    $('section').each(function (i, section) {
	var section_id = $(section).attr('id');
	if (!section_id) {
	    section_id = String.fromCharCode(97 + i);
	    $(section).attr('id', section_id);
	} /* if */
	var first, last;
	var prefix = '#' + section_id + ' > ';
	$(prefix + 'pre, ' + prefix + 'p, ' + prefix + 'blockquote, ' + prefix + 'a.video-link, ' + prefix + '.intro').each(function (j, elem) {
	    var id = $(elem).attr('id');
	    if (!id) {
		id = String.fromCharCode(97 + i) + (j + 1);
		$(elem).attr('id', id);
	    } /* if */
	    backref[id] = blocks.length;
	    blocks.push({
		'id': id,
		'section': section_id,
	    });
	    if (typeof first === 'undefined') {
		first = id;
		last = id;
	    } else {
		last = id;
	    } /* if */
	});
	$(section).find ('h1 + *, .intro, .intro + pre').each(function (j, elem) {
	    let det= $(elem).prop('tagName');
	    console.log(det);
	    if (!det.match(/^(?:SUBLINE|IMG|AUDIO|VIDEO)$/i)) { // failure to sieve these out results in weird errors
		blocks[backref[$(elem).attr('id')]]['h1'] = true;
	    } /* if */
	});
	sections_backref[section_id] = sections.length;
	sections.push({
	    'id': section_id,
	    'first': first,
	    'last': last,
	});
    });
} /* find_blocks */

function reconstruct_sections () {
    let img_sn = 0;
    $('section').each(function (i, section) {
	var section_id = $(section).attr('id');
	var new_section = '';
	var new_node = '';
	$('#' + section_id + ' > *').each(function (j, elem) {
	    if ($(elem).is('pre')) {
		new_node += $(elem).get(0).outerHTML;
	    } else if ($(elem).is('img') && new_node == '') {
		if (typeof bg === 'undefined') {
		    bg = {};
		} /* if */
		id = $(elem).attr('id')? $(elem).attr('id'): 'i' + img_sn;
		src = $(elem).attr('src');
		align = $(elem).attr('align');
		if (align) {
		    var m = align.match(/^\s*(\d+)%\s+(\d+)%\s*$/);
		    if (m) {
			bg[id] = [src, parseFloat(m[1]), parseFloat(m[2])];
		    } else {
			m = align.match(/^\s*(\d+)%\s*$/);
			if (m) {
			    bg[id] = [src, parseFloat(m[1])];
			} else {
			    bg[id] = [src];
			}
		    }
		} else {
		    bg[id] = [src];
		} /* if */
		$(section).attr('img', id);
		$(elem).remove();
		img_sn += 1;
	    } else {
		if (new_node) {
		    new_section += '<div>' + new_node + '</div>';
		} /* if */
		new_section += $(elem).get(0).outerHTML;
		new_node = '';
	    }
	});
	if (new_node) {
	    new_section += '<div>' + new_node + '</div>';
	} /* if */
	$(section).html(new_section);
    });
} /* reconstruct_sections */

function add_citation_mark_to_text (s) {
    var t = '';
    for (var i = 0; i < s.length; i += 1) {
	t += '<span class=cite>' + s[i] + '</span>';
    } /* for */
    return t;
} /* add_citation_mark_to_text */

function add_citation_mark (elem) {
    if ($(elem).children().length) {
	$(elem).children().each(function (i, subelem) {
	    add_citation_mark(subelem);
	});
    } else {
	$(elem).html(add_citation_mark_to_text($(elem).html()));
    } /* if */
} /* add_citation_mark */

function sort_annotations (a, b) {
    // Sort in reverse order
    return a[0] < b[0]? 1: a[0] > b[0]? -1: 0;
} /* sort_annotations */

function parse_annotations (elem) {
    /* Annotation block must be aside class=ruby that contains exactly one dl. Otherwise results are undefined */
    console.log("DEBUG: parse_annotations: entry");
    var it = [];
    var tmp = $(elem).find('dl').children();	// Why the W3C has not grouped dt and dd into di is a mystery (and an annoyance)
    for (var i = 0; i < tmp.length; i += 2) {
	if ($(tmp[i]).is('dt') && $(tmp[i + 1]).is('dd')) {
	    it.push([$(tmp[i]).text().trim(), $(tmp[i + 1]).text().trim()]);
	} else {
	    console.log('ERROR: format error in aside.ruby>dl block');	// FIXME: need proper exception throwing
	} /* if */
    } /* for */
    it = it.sort(sort_annotations);
    console.log("DEBUG: parse_annotations: exit: returning "+it);
    return it;
} /* add_annotations */

function add_annotations (elem, annotations) {
    // Technically we can wrap each compound word in an rb in a ruby, and append rt to the rb,
    // and the ruby-align CSS rule will make the output look right. Unfortunately this does
    // not work in Chrome because ruby support in Chrome is crap. Even multiple-rb/rt-in-ruby
    // does not work in Chrome. Sigh.
    // Since Firefox supports ruby perfectly fine, we avoid split_mode by detecting Firefox 38.
    // This is supposed to be bad practice but there really is no other way around it.
    ruby_ok = navigator.userAgent.search(/\bFirefox\/(?:3[89]|[4-9]\d|\d{3,})\b/) >= 0;
    console.log("DEBUG: add_annotations reached");
    for (var i = 0; i < annotations.length; i += 1) {
	var split_mode = !ruby_ok && annotations[i][0].search(/\s/);
	var target = new RegExp('(^|[^<>]|<(?!(?:ruby|rb|rp|rt))[^<>]*>)(' + annotations[i][0] + ')($|[^<>]|<(?!/(?:ruby|rb|rp|rt))[^<>]*>)', 'g');
	var replacement = '$1<ruby><rb>$2</rb><rp>(</rp><rt>' + annotations[i][1] + '</rt><rp>)</rp></ruby>$3';
	if (split_mode) {
	    var a = annotations[i][0].split('');
	    var b = annotations[i][1].split(/\s+/);
	    if (a.length == b.length) {
		replacement = '$1';
		for (var j = 0; j < a.length; j += 1) {
		    replacement += '<ruby><rb>' + a[j] + '</rb><rt>' + b[j] + '</rt></ruby>';
		} /* for */
		replacement += '$3';
	    } /* if */
	} /* if */
	var a = $(elem).html();
	// Do the replacement twice because $1 might have matched a ruby close tag in the first round
	var b = a.replace(target, replacement).replace(target, replacement);
	if (a != b) {
	    $(elem).html(b);
	} /* if */
    } /* for */
} /* add_annotations */

function activate_replacement_content() { /* This must be done before find_blocks */
    $('span[alt]').each(function (i, elem) {
	let a = $(elem).attr('alt');
	    $(elem).replaceWith(a);
    })
    $('[stanza]+[stanza]').each(function (i, elem) {
	if ($(elem).prev().attr('stanza') == $(elem).attr('stanza')) {
	    $(elem).addClass('contd');
	} /* if */
    })
    $('link[repeat]').each(function (i, elem) {
	let ref = $(elem).attr('repeat');
	let target = $('[stanza="' + ref + '"]');
	if (target) {
	    $(elem).replaceWith(target.get(0).outerHTML);
	    $(elem).attr('id', false)
	} /* if */
    })
} /* activate_replacement_content*/

function fix_content_blocks() {
    /* Remove new lines from address blocks inside pre. This must be the first step */
    $('pre address').each(function (i, elem) {
	$(elem).html($(elem).html().replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '').replace(/[\r\n\s]+/g, ' '));
    });
    /* Break pre into lines. This must be the second step */
    $('pre').each(function (i, elem) {
	let a = $(elem).html();
	let b = a.match(/\S/)? a.split(/(?:\r|\n\r?)/): [];
	a = b.map(x => (x.match(/^<address/)? x:
		'<l class=t-wrapper><span class=t-whiteout></span><span class=t>' + x + '</span></l>')).join('');
	$(elem).html(a);
    });
    /* Copy (standard-compliant) data-start, data-end, data-stanza to (non-compliant) start, end, stanza */
    $('[data-start]').each(function (j, elem) {
	$(elem).attr('start', $(elem).attr('data-start'));
    });
    $('[data-ed]').each(function (j, elem) {
	$(elem).attr('ed', $(elem).attr('data-ed'));
    });
    $('[data-stanza]').each(function (j, elem) {
	$(elem).attr('stanza', $(elem).attr('data-stanza'));
    });
    $('pre').each(function (i, elem) {
	var a0 = $(elem).html();
	var a = a0.trim();
	$(elem).html(a);
	var n = (a.match(/^|\n/g) || []).length;
	$(elem).addClass('n' + n);
    });
    $('pre, p, blockquote').each(function (i, elem) {
	var a = $(elem).html();
	let sp = '<span class=halfwidth>　</span>';
	let wsp_i = '<span class=mbox>';
	let wsp_f = '　</span>';
	a = a.replace(/([:;,])(　)/g, '<span class=nonadv>$1</span>$2');
	a = a.replace(/(、|，|，|。)(?:\r|\n|\s)+/g, '$1');
	a = a.replace(/([^>](?:<\/s>)?)，/g, '$1' + wsp_i + '<span class=nonadv>,</span>' + wsp_f);	// for Ubuntu
	a = a.replace(/([^>](?:<\/s>)?)；/g, '$1' + wsp_i + '<span class=nonadv>;</span>' + wsp_f);	// for Ubuntu
	a = a.replace(/ /g, '<span class=thinsp>&nbsp;</span>');	// many fonts don't have thin space =P
	$(elem).html(a);
    });
    $('section > aside.ruby').each(function (i, elem) {
	var a = parse_annotations(elem);
	$(elem).parent().find('pre').each(function (i, elem) {
	    add_annotations(elem, a);
	});
    });
    $('cite:lang(zh-HK), cite:lang(zh-TW)').each(function (i, elem) {
	add_citation_mark(elem);
    });
    /*
    $('p, blockquote').each(function (i, elem) {
	var a = $(elem).html();
	$(elem).html('<span class=t-wrapper><span class=t-whiteout></span><span class=t>' + a + '</span></span>');
    });
    */
} /* fix_content_blocks */

function recalculate_whiteouts () {
    $('.t-whiteout').each(function (i, elem) {
	var current_width = $(elem).width();
	var correct_width = $(elem).next().width(); /* The result is off and the error is not consistent. I don't know why. */
	if (current_width != correct_width) {
	    $(elem).css('width', correct_width);
	} /* if */
    });
} /* recalculate_whiteouts */

function display_current () {
    var curr_section_id = blocks[cursor].section;
    var curr_section = $('#' + curr_section_id);
    var dx = 0;
    var dy = 0;

    /* Update document title */
    let document_h1 = $($('h1').get(0)).text();
    let section_h1 = $(curr_section.find('h1').get(0)).text();
    let title = document_h1 == section_h1? document_h1: document_h1 + ': ' + section_h1;
    if ($('title').length == 0) {
	$('head').append('<title>' + title + '</title>');
    } else {
	$('title').html(title);
    }

    /* Reset all display classes, remembering where the section start/end are */
    var section_start = -1;
    var section_end = -1;
    var something_active_p = false;
    for (i = 0; i < blocks.length; i += 1) {
	if (blocks[i].section != curr_section_id) {		/* wrong section */
	    $('#' + blocks[i].section).addClass('hidden');
	    $('#' + blocks[i].section + '>h1').removeClass('active');
	} else {						/* right section */
	    $('#' + blocks[i].section).removeClass('hidden');
	    var curr_block = $('#' + blocks[i].id);
	    if (i >= cursor) {
		curr_block.removeClass('cloaked');
		curr_block.removeClass('previous');
	    } else if (i < cursor && !curr_block.is('pre')) {
		curr_block.addClass('cloaked');
	    } /* if */
	    if (section_start < 0) {
		section_start = i;
	    } /* if */
	    section_end = i;
	} /* if */
	if (i != cursor) {
	    $('#' + blocks[i].id).removeClass('active');
	} else {
	    $('#' + blocks[i].id).addClass('active');
	    if (cursor > 1) {
		$('#' + blocks[i - 1].id).addClass('previous');
	    } /* if */
	    if ($('#' + blocks[i].id).text().match(/\S/)) {
		something_active_p = true;
	    } /* if */
	} /* if */
    } /* for */
    if (section_start > -1) {
	if (something_active_p) {
	    $('#' + blocks[section_start].section + '>h1').removeClass('active');
	} else {
	    $('#' + blocks[section_start].section + '>h1').addClass('active');
	} /* if */
    } /* if */

    /* Shift the lyrics up/left */
    if (cursor > section_start) {
	var x0 = $('#' + blocks[section_start].id).get(0).getBoundingClientRect().left;
	var y0 = $('#' + blocks[section_start].id).get(0).getBoundingClientRect().top;
	dx = $('#' + blocks[cursor].id).get(0).getBoundingClientRect().left - x0;
	dy = $('#' + blocks[cursor].id).get(0).getBoundingClientRect().top - y0;
    } /* if */
    curr_section.css('left', Math.round(-dx) + 'px');
    curr_section.css('top', Math.round(-dy) + 'px');
    console.log($('#' + blocks[cursor].id).get(0).getBoundingClientRect());

    /* Handle h1 */
    if (cursor > section_start) {
	curr_section.find('h1').addClass('deemphasized');
    } else {
	curr_section.find('h1').removeClass('deemphasized');
    } /* if */

    /* Handle backgrounds */
    if (typeof bg !== 'undefined') {
	requested_bg = curr_section.attr('img');
	if (!requested_bg) {
	    requested_img = false;
	    requested_pos = false;
	} else if (typeof bg[requested_bg] == 'object') {
	    requested_img = bg[requested_bg][0];
	    if (bg[requested_bg].length > 2) {
		requested_pos = bg[requested_bg][1] + '%' + bg[requested_bg][2] + '%';
	    } else if (bg[requested_bg].length > 1) {
		requested_pos = '50% ' + bg[requested_bg][1] + '%';
	    } else {
		requested_pos = false;
	    } /* if */
	} else {
	    requested_img = bg[requested_bg];
	    requested_pos = false;
	} /* if */
	if (requested_img) {
	    expected_bg = 'url(' + requested_img + ')';
	} else {
	    expected_bg = false;
	} /* if */
	if ($('#background-image').css('background-image') != expected_bg) {
	    $('#background-image').css('background-image', expected_bg);
	} /* if */
	$('#background-image').css('background-position', (requested_pos? requested_pos: '50% 50%'));
    } /* if */
    var curr_section = $('#' + blocks[cursor].section);
    if (curr_section.hasClass('red')) {
	$('#background-color').attr('bgcolor', 'red');
    } else if (curr_section.hasClass('blue')) {
	$('#background-color').attr('bgcolor', 'blue');
    } else if (curr_section.hasClass('black')) {
	$('#background-color').attr('bgcolor', 'black');
    } else {
	$('#background-color').attr('bgcolor', '');
    } /* if */

    /* Handle stanza status */
    if ($('#' + blocks[cursor].id).attr('stanza')) {
	$('#stanza').html($('#' + blocks[cursor].id).attr('stanza'));
    } else {
	$('#stanza').html('');
    } /* if */

    recalculate_whiteouts();
} /* display_current */

function jump_to_block (line) {
    if (line >= 0 && line < blocks.length) {
	prev = cursor;
	cursor = line;
	display_current();
    } /* if */
} /* jump_to_block */

function previous_block () {
    if (cursor > 0) {
	jump_to_block(cursor - 1);
    } /* if */
    r1 = 0;
} /* previous_block */

function next_block () {
    if (cursor < blocks.length - 1) {
	jump_to_block(cursor + 1);
    } /* if */
    r1 = 0;
} /* next_block */

function last_block () {
    jump_to_block(blocks.length - 1);
    r1 = 0;
} /* last_block */

function jump_to_section (line) {
    if (line >= 0 && line < sections.length) {
	jump_to_block(backref[sections[line]['first']]);
    } /* if */
} /* jump_to_section */

function jump_to_beginning_of_section () {
    var section = sections_backref[blocks[cursor].section];
    jump_to_section(section);
} /* jump_to_beginning_of_section */

function jump_to_end_of_section () {
    var section = sections_backref[blocks[cursor].section];
    jump_to_block(backref[sections[section].last]);
} /* jump_to_beginning_of_section */

function previous_section () {
    var section = sections_backref[blocks[cursor].section];
    section -= 1;
    if (section < 0) {
	;
    } else {
	jump_to_block(backref[sections[section].first]);
    } /* if */
    r1 = 0;
} /* previous_section */

function next_section () {
    var section = sections_backref[blocks[cursor].section];
    section += 1;
    if (section >= section.length) {
	;
    } else {
	jump_to_block(backref[sections[section].first]);
    } /* if */
    r1 = 0;
} /* next_section */

function last_section () {
    jump_to_block(backref[sections[sections.length - 1]['first']]);
    r1 = 0;
} /* last_block */

function cancel_auto_advance () {
    if (timer_pid) {
	clearTimeout(timer_pid);
	timer_pid = false;
	$('#timer').html('');
    } /* if */
} /* cancel_auto_advance */

function stop_audio () {
    let expected_section = sections_backref[blocks[cursor].section];
    let audio = $('#' + blocks[expected_section].section + '>audio');
    if (audio.length > 0) {
	audio.get(0).pause();
    } /* if */
} /* stop_audio */

function set_audio_volume () {
    let expected_section = sections_backref[blocks[cursor].section];
    let audio = $('#' + sections[expected_section].id + '>audio');
    if (audio.length > 0) {
	audio.get(0).volume = volume/100;
	$('#volume').html((volume == 0? '🔇': volume < 33? '🔈': volume < 66? '🔉': '🔊') + '<br>' + volume);
    } else {
	$('#volume').html('');
    } /* if */
} /* set_audio_volume */

function check_auto_advance (t0, t_i, t_thres, expected_section) {
    let t = (Date.now() - t0)/1000 + t_i;
    let curr = $('#' + blocks[cursor].id);
    let next = cursor + 1 < blocks.length? $('#' + blocks[cursor + 1].id): false;
    let $next = $(next);
    let t_next = next? parseFloat($next.attr('start')): false;
    let t_stop = next? parseFloat($next.attr('stop')): false;
    $('#timer').html(Math.floor(t) + '<br>' + (t_next? Math.floor(t_next - t): '—'));
    if (t > t_thres) {		// XXX de-emphasize the song title after 10 seconds of music
	curr_section = $('#' + blocks[cursor].section).find('h1').addClass('deemphasized');
    } /* if */
    if ((t_stop && t >= t_stop) || !t_next) {
	cancel_auto_advance();
    } else if (t_next && t >= t_next) {
	next_block();
	if (sections_backref[blocks[cursor].section] != expected_section) {
	    cancel_auto_advance();
	    previous_block(); // FIXME: This is sometimes needed but sometimes not. I don't know why.
	} /* if */
    } /* if */
} /* check_auto_advance */

function start_auto_advance () {
    let t0 = Date.now();
    let expected_section = sections_backref[blocks[cursor].section];
    let curr = $('#' + blocks[cursor].id);
    let t_curr = parseFloat($(curr).attr('start'));
    let audio = $('#' + sections[expected_section].id + '>audio');
    cancel_auto_advance();
    if (audio.length > 0) {
	set_audio_volume();
	audio.get(0).play();
	t_curr = audio.get(0).currentTime;
	if (t_curr == 0) {
	    jump_to_beginning_of_section();
	} /* if */
    } /* if */
    
    /* Figure out when we should de-emphasize the heading */
    let t_thres = t0 + 10;
    let det = $('#' + blocks[backref[sections[expected_section]['first']]].id);
    if ($(det).attr('start')) {
	let t_det = parseFloat($(det).attr('start'));
	if (t_det == 0) {
	    det = $(det).next()
	    t_det = parseFloat($(det).attr('start'));
	} /* if */
	if (t_det && t_det > 0) {
	    let candidate = t_det - 5;
	    console.log('lyrics threshold=' + t_det + ', candidate=' + candidate);
	    if (t_thres < candidate) {
		t_thres = candidate;
	    } /* if */
	} /* if */
    } /* if */

    /* Start the timer */
    timer_pid = setInterval(function () {
	check_auto_advance(t0, t_curr, t_thres, expected_section);
    }, 100);
} /* start_auto_advance */

function add_gui_controls () {
    $('body').append('<nav id=end>&#10515;G </nav>');
    $('body').append('<nav id=home>⤒H </nav>');
    $('body').append('<nav id=next>l ↓ </nav>');
    $('body').append('<nav id=prev>h ↑ </nav>');
    $('body').append('<footer id=timer></footer>');
    $('body').append('<footer id=stanza></footer>');
    $('body').append('<footer id=volume></footer>');
    $('#prev').click(function () {
	previous_block();
    });
    $('#next').click(function () {
	next_block();
    });
    $('#home').click(function () {
	cursor = 0;
	display_current();
    });
    $('#end').click(function () {
	last_section();
    });
} /* add_gui_controls */

function create_background_layers() {
    $('body').prepend ('<div id=background-image></div>');
    $('body').prepend ('<div id=background-color></div>');
} /* create_background_layers*/

function create_help_screen() {
    $('body').append ('<aside id=help class=hidden>'
		    + '<h1>Keys</h1>'
		    + '<p>Navigation controls are mostly vi compatible:'
		    + '<dl>'
		    + '<dt>l (or space bar)'
		    + '<dd>Advance slide'
		    + '<dt>h'
		    + '<dd>Go back'
		    + '<dt>0 (zero)'
		    + '<dd>Beginning of slide'
		    + '<dt>$'
		    + '<dd>End of slide'
		    + '<dt>j'
		    + '<dd>Next slide'
		    + '<dt>k'
		    + '<dd>Previous slide'
		    + '<dt>H'
		    + '<dd>First slide'
		    + '<dt>G'
		    + '<dd>Last slide'
		    + "<dt>'' (double apostrophe)"
		    + '<dd>Jump to last position'
		    + '<dt>z'
		    + '<dd>Start auto advance'
		    + '<dt>Z'
		    + '<dd>Cancel auto advance'
		    + '<dt>?'
		    + '<dd>Show/hide this help screen'
		    + '</dl>'
		    + '</aside>');
} /* create_help_screen */

function listen_for_style_changes () {
    /* v. https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver (q.v.) */
    /* But this does not seem to work, at all. */
    $('body').append('<aside class=cloaked id=sentinel>(The end.)</aside>');
    const targetNode = document.getElementById('sentinel');
    const config = { attributes: true, };
    const callback = function(mutationsList, observer) {
	console.log('XYZZY mutation observed');
	recalculate_whiteouts();
    };
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
} /* listen_for_style_changes */

$(function () {
    create_background_layers();
    remove_unused_items();
    activate_replacement_content();
    find_blocks();
    reconstruct_sections();
    fix_content_blocks();
    add_gui_controls();
    display_current();
    create_help_screen();
    listen_for_style_changes();
    $('body').keypress(function( event ) {
	if (event.metaKey) {					// Command modified - ignore
	    ;
	} else if (marking) {
	    markers[event.which] = cursor;
	    marking = false;
	} else if (recalling) {
	    if (event.which == 39) {
		jump_to_block(prev);
	    } else if (typeof(markers[event.which]) !== 'undefined') {
		jump_to_block(markers[event.which]);
	    } /* if */
	    recalling = false;
	} else if (event.which == 32) {				// sp
	    next_block();
	} else if (event.which == 36) {				// $
	    jump_to_end_of_section();
	} else if (event.which == 39) {				// '
	    recalling = true;
	} else if (event.which == 48 && !r1) {			// 0
	    jump_to_beginning_of_section();
	} else if (event.which >= 48 && event.which <= 57) {	// 0..9
	    r1 *= 10;
	    r1 += event.which - 48;
	} else if (event.which == 63) {				// ?
	    if ($('#help').hasClass('hidden')) {
		$('#help').removeClass('hidden');
	    } else {
		$('#help').addClass('hidden');
	    } /* if */
	} else if (event.which == 71) {				// G
	    if (r1 == 0) {
		last_section();
	    } else {
		jump_to_section(r1 - 1);
		r1 = 0;
	    }
	    recalculate_whiteouts();
	    r1 = 0;
	} else if (event.which == 72) {				// H
	    if (r1 == 0) {
		jump_to_section(0);
	    } else {
		jump_to_section(r1 - 1);
		r1 = 0;
	    }
	    recalculate_whiteouts();
	} else if (event.which == 90) {				// Z (NOTE: NOT VI COMPATIBLE)
	    cancel_auto_advance();
	} else if (event.which == 102) {			// f (NOTE: NOT VI COMPATIBLE)
	    if (volume < 100) {
		volume += 25;
		set_audio_volume();
	    } /* if */
	} else if (event.which == 104) {			// h
	    previous_block();
	} else if (event.which == 106) {			// j
	    next_section();
	} else if (event.which == 107) {			// k
	    previous_section();
	} else if (event.which == 108) {			// l
	    next_block();
	} else if (event.which == 109) {			// m
	    marking = true;
	} else if (event.which == 112) {			// p (NOTE: NOT VI COMPATIBLE)
	    if (volume > 0) {
		volume -= 25;
		set_audio_volume();
	    } /* if */
	} else if (event.which == 122) {			// z (NOTE: NOT VI COMPATIBLE)
	    start_auto_advance();
	} else {
	    console.log(event.which);
	} /* if */
    });
    $('body').keydown(function( event ) {			// keypress does not receive events from special or modifier keys
	var reset_needed = true;
	if (event.which == 37 && !event.metaKey) {		// left arrow
	    previous_block();
	} else if (event.which == 38 && !event.metaKey) {	// up arrow
	    previous_block();
	} else if (event.which == 39 && !event.metaKey) {	// right arrow
	    next_block();
	} else if (event.which == 40 && !event.metaKey) {	// down arrow
	    next_block();
	} else if (event.which == 37 && event.metaKey) {	// command-left arrow (NOTE: command modifiers are unsafe!)
	    previous_section();
	} else if (event.which == 38 && event.metaKey) {	// command-up arrow
	    previous_section();
	} else if (event.which == 39 && event.metaKey) {	// command-right arrow
	    next_section();
	} else if (event.which == 40 && event.metaKey) {	// command-down arrow
	    next_section();
	} else {
	    reset_needed = false;
	} /* if */
	if (reset_needed) {
	    marking = false;
	    recalling = false;
	    r1 = 0;						// technically not needed because jump_to_block() resets it automatically
	} /* if */
    });
});
