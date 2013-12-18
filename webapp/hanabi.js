var PACKAGE = 'play-hanabi';
var BASE_URL = location.href;
if (BASE_URL.indexOf('?') != -1) {
	BASE_URL = BASE_URL.substring(0, BASE_URL.indexOf('?'));
}

var game_data = {};

function commonError(xhr, textStatus, errorThrown)
{
	alert("ajax error: "+textStatus+" "+errorThrown);
}

function do_login()
{
	var onSuccess = function(data) {

		// store session id
		var sid = data.sid;
		sessionStorage.setItem(PACKAGE+'.sid', sid);

		// send user to lobby
		location.href = 'lobby.html';
	};

	$.ajax({
		type: 'POST',
		url: 's/login',
		data: {
			name: document.login_form.username.value
			},
		dataType: 'json',
		success: onSuccess,
		error: commonError
		});
}

function get_query_args()
{
	var url = location.href;
	if (url.indexOf('?') == -1) {
		return {};
	}
	var qs = url.substring(url.indexOf('?')+1);
	var parts = qs.split('&');
	var rv = {};
	for (var i = 0; i < parts.length; i++) {
		var pp = parts[i].split('=');
		rv[pp[0]] = pp[1];
	}
	return rv;
}

function setup_hint_dialog_table(seatId)
{
	var player_names = {};
	var seat = null;
	for (var i = 0; i < game_data.seats.length; i++) {
		player_names[game_data.seats[i].seat] = game_data.seats[i].playerName;
		if (game_data.seats[i].seat == seatId) {
			seat = game_data.seats[i];
		}
	}
	if (seat == null) {
		alert("don't know that seat");
	}

	$('#hint_dialog .player_name').text(seat.playerName);

	$('#hint_dialog .hints_table .hint_row').remove();
	$('#hint_dialog .hints_table td.added').remove();

	for (var i = 0; i < seat.hand.length; i++) {
		var $td = $('<td align="center"><div class="cards"><img class="card_face"></div></td>');
		$td.addClass('added');
		$td.attr('data-slot', i);
		set_card($('.card_face', $td), seat.hand[i]);
		$('#hint_dialog .hints_table .hand_row').append($td);
	}

	var hint_count = 0;
	var $tbl = $('#hint_dialog .hints_table');
	for (var i = 0; i < game_data.hints.length; i++) {
		var hint = game_data.hints[game_data.hints.length-1-i];
		if (hint.to != seatId) {
			continue;
		}

		var countApplicable = 0;
		for (var j = 0; j < hint.applies.length; j++) {
			var x = hint.applies[j];
			if (x != '') {
				countApplicable++;
			}
		}
		if (countApplicable == 0) {
			continue;
		}

		hint_count++;
		var $h = $('.hint_row.template').clone();
		$h.removeClass('template');
		$h.addClass(hint_count % 2 == 0 ? 'even_row' : 'odd_row');
		$('.from.player_name', $h).text(player_names[hint.from]);
		$('.hint', $h).text(hint.hint);

		for (var j = 0; j < hint.applies.length; j++) {
			var $td = $('<td></td>');
			var x = hint.applies[j];
			$td.text(x == 'Y' ? 'X' : x == 'N' ? 'O' : '');
			$td.attr('data-slot', j);
			$h.append($td);
		}

		$tbl.append($h);
	}

	if (hint_count == 0) {
		$('#hint_dialog .no_previous_hints').show();
		$('#hint_dialog .some_previous_hints').hide();
	}
	else {
		$('#hint_dialog .no_previous_hints').hide();
		$('#hint_dialog .some_previous_hints').show();
	}
}

function play_card_btn_clicked()
{
	var box = this;
	while (!box.hasAttribute('data-slot') && box.parentNode) {
		box = box.parentNode;
	}
	var handSlot = box.getAttribute('data-slot');
	play_card(handSlot);
}

function discard_card_btn_clicked()
{
	var box = this;
	while (!box.hasAttribute('data-slot') && box.parentNode) {
		box = box.parentNode;
	}
	var handSlot = box.getAttribute('data-slot');
	discard_card(handSlot);
}

function hint_btn_clicked()
{
	var box = this;
	while (!box.hasAttribute('data-seat-id') && box.parentNode) {
		box = box.parentNode;
	}
	var seatId = box.getAttribute('data-seat-id');

	$('#hint_dialog').attr('data-seat-id', seatId);
	setup_hint_dialog_table(seatId);

	$('#dimmer').show();
	$('#hint_dialog').show();
}

function hint_dlg_cancel()
{
	$('#hint_dialog').hide();
	$('#dimmer').hide();
}

function remove_hand_slot(seatId, slot, andThen)
{
	var $box = $('.other_players_area .other_player[data-seat-id="'+seatId+'"]');
	if ($box.length == 0) {
		remove_slot_my_hand(slot, andThen);
	}
	else {
		$('[data-slot="'+slot+'"]', $box).hide('slow', function()
			{

			// remove card
			$('[data-slot="'+slot+'"]', $box).remove();

			// shift slots for remaining cards
			var $x = $('[data-slot="'+(1+slot)+'"]', $box);
			while ($x.length) {
				$x.attr('data-slot', slot);
				slot++;
				$x = $('[data-slot="'+(1+slot)+'"]', $box);
			}

			andThen();
		});
	}
}

function on_new_card_event(evt, andThen)
{
	var seatId = evt.target;
	var $box = $('.other_players_area .other_player[data-seat-id="'+seatId+'"]');
	if ($box.length != 0) {

		var $c = $('<img class="card_face">');
		$c.hide();
		$c.attr('data-slot', evt.handSlot);
		set_card($c, evt.newCard);
		$('.cards', $box).append($c);

		$c.show('slow', andThen);
		return;
	}

	// own hand
	var $td_content = $('#my_hand_slot_template').clone();
	$td_content.removeClass('template');

	var $td = $('<td></td>');
	$td.append($td_content);
	$td.hide();

	$td.attr('data-slot', evt.handSlot);
	set_card($('.card_face', $td), evt.newCard);

	$('.play_card_btn', $td).click(play_card_btn_clicked);
	$('.discard_card_btn', $td).click(discard_card_btn_clicked);

	$('#hints_table .my_hand').append($td);
	$td.show('slow', andThen);
}

function on_discard_event(evt, andThen)
{
	var $box = $('.other_players_area .other_player[data-seat-id="'+evt.actor+'"]');
	var $card;
	if ($box.length) {
		$card = $('.card_face[data-slot="'+evt.handSlot+'"]', $box);
	}
	else {
		$card = $('.my_hand [data-slot="'+evt.handSlot+'"] .card_face');
	}

	if ($card.length == 0) {
		alert("could not find a card for seat "+evt.actor+" slot "+evt.handSlot);
		return;
	}

	var origPos;
	var destPos;
	var moveStartTime;
	var moveTowardsDiscard;
	moveTowardsDiscard = function() {

		var portion = (new Date().getTime() - moveStartTime) / 1000;
		if (portion < 0.0) { portion = 0.0; }
		if (portion > 1.0) { portion = 1.0; }

		var tmpX = origPos.left + (destPos.left - origPos.left) * portion;
		var tmpY = origPos.top + (destPos.top - origPos.top) * portion;
		var tmpS = 2.0 + (1.0-2.0) * portion;

		$('#floating_card').css({
			'transform': 'scale('+tmpS+')',
			'left': tmpX+'px',
			'top': tmpY+'px'
			});
		
		if (portion < 1.0) {
			window.setTimeout(moveTowardsDiscard, 30);
		}
		else {
			$('#floating_card').hide();
			set_card($('.discard_pile .card_face'), evt.discardCard);

			remove_hand_slot(evt.actor, evt.handSlot, andThen);
		}
	};

	var showFloatingCard = function() {

		origPos = $card.offset();
		destPos = $('.discard_pile').offset();
		moveStartTime = new Date().getTime()+500;

		set_card($('#floating_card .card_face'), evt.discardCard);
		$('#floating_card').css({
			'transform': 'scale(2)',
			'left': origPos.left+'px',
			'top':  origPos.top+'px'
			});
		$('#floating_card').show();

		window.setTimeout(moveTowardsDiscard, 500);
	};

	var flashCount = 0;
	var flashFn;
	flashFn = function() {
		flashCount++;
		if (flashCount % 2 == 1) {
			$card.css({ 'visibility': 'hidden' });
		}
		else {
			$card.css({ 'visibility': 'visible' });
		}
		if (flashCount < 7) {
			window.setTimeout(flashFn, 200);
		}
		else {
			showFloatingCard();
		}
	};
	flashFn();
}

function move_card_helper(origPos, destPos, andThen)
{
	var startTime = new Date().getTime();
	var duration = 1000;
	var moveFn;
	moveFn = function() {

		var portion = (new Date().getTime() - startTime) / duration;
		if (portion < 0) { portion = 0; }
		if (portion > 1) { portion = 1; }

		var tmpX = origPos.left + (destPos.left - origPos.left) * portion;
		var tmpY = origPos.top + (destPos.top - origPos.top) * portion;
		var tmpS = 2.0 + (1.0-2.0) * portion;

		$('#floating_card').css({
			'transform': 'scale('+tmpS+')',
			'left': tmpX+'px',
			'top': tmpY+'px'
			});
		
		if (portion < 1.0) {
			window.setTimeout(moveFn, 30);
		}
		else {
			$('#floating_card').hide();
			andThen();
		}
	};
	moveFn();
	$('#floating_card').show();
}

function on_play_card_event(evt, andThen)
{
	var $box = $('.other_players_area .other_player[data-seat-id="'+evt.actor+'"]');
	var $card;
	if ($box.length) {
		$card = $('.card_face[data-slot="'+evt.handSlot+'"]', $box);
	}
	else {
		$card = $('.my_hand [data-slot="'+evt.handSlot+'"] .card_face');
	}

	if ($card.length == 0) {
		alert("could not find a card for seat "+evt.actor+" slot "+evt.handSlot);
		return;
	}

	var hideStrikes = function() {
		$('#strike_dialog').hide();
		$('#dimmer').hide();
		$('.strike_clone').remove();

		var origPos = $('#play_area_box [data-suit="'+evt.suit+'"] .card_face').offset();
		var destPos = $('.discard_pile').offset();
		move_card_helper(origPos, destPos, function() {
			set_card($('.discard_pile .card_face'), evt.playCard);
			remove_hand_slot(evt.actor, evt.handSlot, andThen);
			});
	};

	var showStrikes = function() {

		// show the large card again, ready to move to discard
		$('#floating_card').css({
			'transform': 'scale(2)'
			});
		$('#floating_card').show();

		// add additional strikes if necessary
		for (var i = 1; i < evt.errorCount && i < 3; i++) {
			var $s = $('#master_strike').clone();
			$s.removeAttr('id');
			$s.addClass('strike_clone');
			$('#master_strike').after($s);
		}

		// calculate vertical offset for strikes overlay
		var h = $('#strike_dialog').height();
		$('#strike_dialog').css({
			'top': (window.innerHeight-h)/2 + 'px'
			});

		// dim the background, show the strikes div, for 2 sec
		$('#dimmer').show();
		$('#strike_dialog').show();
		window.setTimeout(hideStrikes, 2000);
	};

	var atPile = function() {

		if (evt.success) {

			set_card($('#play_area_box [data-suit="'+evt.suit+'"] .card_face'), evt.playCard);
			remove_hand_slot(evt.actor, evt.handSlot, andThen);
		}
		else {
			showStrikes();
		}
	};

	var showFloatingCard = function() {

		var origPos = $card.offset();
		var destPos = $('#play_area_box [data-suit="'+evt.suit+'"] .card_face').offset();

		set_card($('#floating_card .card_face'), evt.playCard);
		$('#floating_card').css({
			'transform': 'scale(2)',
			'left': origPos.left+'px',
			'top':  origPos.top+'px'
			});
		$('#floating_card').show();

		window.setTimeout(function() {
			move_card_helper(origPos, destPos, atPile);
			}, 500);
	};

	var flashCount = 0;
	var flashFn;
	flashFn = function() {
		flashCount++;
		if (flashCount % 2 == 1) {
			$card.css({ 'visibility': 'hidden' });
		}
		else {
			$card.css({ 'visibility': 'visible' });
		}
		if (flashCount < 7) {
			window.setTimeout(flashFn, 200);
		}
		else {
			showFloatingCard();
		}
	};
	flashFn();
}

function remove_slot_my_hand(slot, andThen)
{
	var $col = $('#hints_table td[data-slot="'+slot+'"]');
	var remaining = $col.length;
	var complete = function() {
		if (--remaining == 0) {
			$col.remove();
			shift_hint_table_columns(slot);
			andThen();
		}
	};

	$col.hide('slow', complete);
}

function shift_hint_table_columns(slot)
{
	var $tds = $('#hints_table [data-slot="'+(1+slot)+'"]');
	if ($tds.length) {
		$tds.attr('data-slot', slot);
		return shift_hint_table_columns(1+slot);
	}
}

function set_card($card_face, card)
{
	$card_face.attr('src', get_card_image(card));
}

function get_hint_anchor(seatId)
{
	var $h = $('#floating_hint');

	var $box = $('.other_players_area .other_player[data-seat-id="'+seatId+'"]');
	if ($box.length != 0) {
		var p = $box.offset();
		p.left += $box.outerWidth()/2 - $h.outerWidth()/2;
		p.top += $box.outerHeight() - $h.outerHeight()/2;
		return p;
	}
	else {
		var w = $('.my_area #hints_table').outerWidth();
		var cx = $h.outerWidth();
		var p = $('.my_area').offset();
		return {
			'left': p.left + w/2 - $h.outerWidth()/2,
			'top': p.top
			};
	}
}

function on_hint_event(evt, andThen)
{
	var $h = $('#floating_hint');
	var imgref = evt.hintType == 'SUIT' ?
			('cards/'+evt.hint+'.png') :
			('cards/unknown_'+evt.hint+'.png')

	$('.hint_icon', $h).attr('src', imgref);
	$('.hint_icon', $h).attr('alt', evt.hint);

	// find origin and destination of hint
	var origPos = get_hint_anchor(evt.actor);
	var destPos = get_hint_anchor(evt.target);

	$h.css({
		'left': origPos.left+'px',
		'top': origPos.top+'px'
		});
	$h.show();

	animated_move_to($h, destPos, 500, function()
		{

		var $box = $('.other_players_area .other_player[data-seat-id="'+evt.target+'"]');
		$('.cards', $box).addClass('dim');
		for (var i = 0; i < evt.applies.length; i++) {
			if (evt.applies[i] == "Y") {
				$('.cards [data-slot="'+i+'"]', $box).addClass('hilite');
			}
		}

		window.setTimeout(function() {

			$('.cards', $box).removeClass('dim');
			$('.cards .hilite').removeClass('hilite');
			$h.hide();
			andThen();

			}, 2500);
		});
}

function animated_move_to($box, destPos, duration, andThen)
{
	var origPos = $box.offset();
	var startTime = new Date().getTime();
	function moveFn() {

		var portion = (new Date().getTime() - startTime) / duration;
		if (portion < 0) { portion = 0; }
		if (portion > 1) { portion = 1; }

		var tmpX = origPos.left + (destPos.left - origPos.left) * portion;
		var tmpY = origPos.top + (destPos.top - origPos.top) * portion;

		$box.css({
			'left': tmpX+'px',
			'top': tmpY+'px'
			});

		if (portion < 1) {
			window.setTimeout(moveFn, 30);
		}
		else if (andThen) {
			andThen();
		}
	};
	moveFn();
}

function on_event(evt, andThen)
{
	if (evt.event == 'discard') {
		on_discard_event(evt, andThen);
	}
	else if (evt.event == 'hint') {
		on_hint_event(evt, andThen);
	}
	else if (evt.event == 'new_card') {
		on_new_card_event(evt, andThen);
	}
	else if (evt.event == 'next_turn') {
		location.reload();
	}
	else if (evt.event == 'play_card') {
		on_play_card_event(evt, andThen);
	}
	else {
		alert("got event: "+evt.message);
		andThen();
	}
}

var nextEventId = null;
var eventFetchErrorCount = 0;
function startEventSubscription()
{
	var queryArgs = get_query_args();
	var gameId = queryArgs.game;

	var onSuccess = function(data) {

		// clear error indicator (if lit)
		eventFetchErrorCount = 0;
		$('#ajaxErrorInd').hide();

		// what to do after processing the event
		var fn = function() {
			nextEventId = data.nextEvent;
			startEventSubscription();
			};

		// process the event, if any
		if (data.event) {
			on_event(data.event, fn);
		}
		else {
			fn();
		}

	};
	var onError = function(xhr, textStatus, errorThrown) {

		eventFetchErrorCount++;
		if (eventFetchErrorCount == 2) {
			$('#ajaxErrorInd').show();
		}
		// the user interrupting the query to reload the page
		// or navigate elsewhere will cause an error here,
		// so at first it is safe to just ignore and try again
		window.setTimeout(startEventSubscription,
			eventFetchErrorCount < 5 ? 2000 :
			eventFetchErrorCount < 10 ? 20000 :
			300000);
	};

	document.title = 'Fetching event '+nextEventId +" ("+eventFetchErrorCount+")";
	$.ajax({
		type: "GET",
		url: "s/event",
		data: {
			sid: sessionStorage.getItem(PACKAGE+'.sid'),
			game: gameId,
			event: nextEventId
			},
		dataType: 'json',
		timeout: 180000, //server should respond before this
		success: onSuccess,
		error: onError
		});
}

function init_game_page_controls()
{
	var mySeat = null;

	$('.cards_left_ind').text(game_data.drawPile);
	$('.hints_left_ind').text(game_data.hintsLeft);

	// figure out which seat is "me"
	var myVantagePoint = 0;
	for (var i = 0; i < game_data.seats.length; i++) {
		if (game_data.seats[i].isYou) {
			myVantagePoint = i;
			break;
		}
	}

	var player_names = {};
	for (var i = 0; i < game_data.seats.length; i++) {
		var seat = game_data.seats[(myVantagePoint+i)%game_data.seats.length];
		player_names[seat.seat] = seat.playerName;

		if (seat.isYou) {
			mySeat = seat;
			continue;
		}

		$x = $('.other_player.template').clone();
		$x.removeClass('template');
		$x.attr('data-seat-id', seat.seat);
		$('.player_name', $x).text(seat.playerName);
		make_cards($('.cards', $x), seat.hand);
		$('.other_players_container').append($x);

		$('button.hint_btn', $x).click(hint_btn_clicked);
	}

	$('.other_player[data-seat-id="'+game_data.activePlayer+'"] .active_player_ind').show();

	for (var suit in game_data.piles) {
		var topCard = game_data.piles[suit];
		if (topCard) {
			$('#play_area_box .pile[data-suit="'+suit+'"] .card_face').attr('src',
				get_card_image(topCard)
				);
		}
	}

	if (game_data.discards.length > 0) {
		var topCard = game_data.discards[game_data.discards.length-1];
		$('#discard_pile_box .pile .card_face').attr('src',
				get_card_image(topCard)
				);
	}

	var known_suits = {};
	var known_ranks = {};
	var hint_count = 0;
	for (var i = 0; i < game_data.hints.length; i++) {
		var hint = game_data.hints[game_data.hints.length-1-i];
		if (hint.to != mySeat.seat) {
			continue;
		}

		var countApplicable = 0;
		for (var j = 0; j < hint.applies.length; j++) {
			var x = hint.applies[j];
			if (x != '') {
				countApplicable++;
			}
		}
		if (countApplicable == 0) {
			continue;
		}

		hint_count++;
		var $h = $('.hint_row.template').clone();
		$h.removeClass('template');
		$h.addClass(hint_count % 2 == 0 ? 'even_row' : 'odd_row');
		$('.from.player_name', $h).text(player_names[hint.from]);
		$('.hint', $h).text(hint.hint);

		for (var j = 0; j < hint.applies.length; j++) {
			var $td = $('<td></td>');
			var x = hint.applies[j];
			$td.text(x == 'Y' ? 'X' : x == 'N' ? 'O' : '');
			$td.attr('data-slot', j);
			$h.append($td);

			if (x == 'Y') {
				if (hint.hintType == 'SUIT') {
					known_suits[j] = hint.hint;
				}
				else if (hint.hintType == 'RANK') {
					known_ranks[j] = hint.hint;
				}
				else {
					alert("unknown hint type "+hint.hintType);
				}
			}
		}

		$('#hints_table').append($h);
	}

	for (var slot = 0; slot < 5; slot++) {
		if (known_suits[slot] && known_ranks[slot]) {
			var card = known_suits[slot]+'-'+known_ranks[slot];
			$('.my_hand [data-slot="'+slot+'"] .card_face').attr('src',
					get_card_image(card)
					);
		}
		else if (known_suits[slot]) {
			var card = known_suits[slot];
			$('.my_hand [data-slot="'+slot+'"] .card_face').attr('src',
					'cards/'+card+'.png'
					);
		}
		else if (known_ranks[slot]) {
			var rank = known_ranks[slot];
			$('.my_hand [data-slot="'+slot+'"] .card_face').attr('src',
					'cards/unknown_'+rank+'.png'
					);
		}
	}

	nextEventId = game_data.nextEvent;
	startEventSubscription();
}

function get_card_image(card)
{
	if (card == 'unknown') { return 'cards/null.png'; }

	var p = card.split('-');
	return 'cards/'+p[0]+'_'+p[1]+'.png';
}

function make_cards($box, card_array)
{
	for (var i = 0; i < card_array.length; i++) {
		var card = card_array[i];
		var $c = $('<img class="card_face">');
		$c.attr('data-slot', i);
		set_card($c, card);
		$box.append($c);
	}
}

function init_game_page()
{
	var queryArgs = get_query_args();
	var gameId = queryArgs.game;

	var onSuccess = function(data) {
		game_data = data;
		init_game_page_controls();
	};

	$.ajax({
		type: 'GET',
		url: 's/game',
		data: {
			sid: sessionStorage.getItem(PACKAGE+'.sid'),
			game: gameId
			},
		dataType: 'json',
		success: onSuccess,
		error: commonError
		});
}

$(function() {
	$('.remote_user').text(
		sessionStorage.getItem(PACKAGE+'.sid')
		);
	$('.hint_choice_btn').click(on_hint_choice_clicked);

	if (document.getElementById('game_page')) {
		init_game_page();
	}
});

function on_hint_choice_clicked()
{
	var hint_selected = this.getAttribute('data-hint-choice');
	var seatId = $('#hint_dialog').attr('data-seat-id');

	give_hint(seatId, hint_selected);
	$('#hint_dialog').hide();
	$('#dimmer').hide();
}

function give_hint(seatId, hint)
{
	var queryArgs = get_query_args();
	var gameId = queryArgs.game;

	var onSuccess = function(data) {
		//nothing
		};

	$.ajax({
		type: 'POST',
		url: 's/game',
		data: {
			sid: sessionStorage.getItem(PACKAGE+'.sid'),
			game: gameId,
			action: 'give_hint',
			target: seatId,
			hint: hint
			},
		dataType: 'json',
		success: onSuccess,
		error: commonError
		});
}

function play_card(slot)
{
	var queryArgs = get_query_args();
	var gameId = queryArgs.game;

	var onSuccess = function(data) {
		// no need to do anything on success;
		// we will get an event telling us what happened
		};

	$.ajax({
		type: 'POST',
		url: 's/game',
		data: {
			sid: sessionStorage.getItem(PACKAGE+'.sid'),
			game: gameId,
			action: 'play_card',
			handSlot: slot
			},
		dataType: 'json',
		success: onSuccess,
		error: commonError
		});
}

function discard_card(slot)
{
	var queryArgs = get_query_args();
	var gameId = queryArgs.game;

	var onSuccess = function(data) {
		//ignore;
		// we rely on receiving an event to tell us
		// the result of the discard
		};

	$.ajax({
		type: 'POST',
		url: 's/game',
		data: {
			sid: sessionStorage.getItem(PACKAGE+'.sid'),
			game: gameId,
			action: 'discard_card',
			handSlot: slot
			},
		dataType: 'json',
		success: onSuccess,
		error: commonError
		});
}
