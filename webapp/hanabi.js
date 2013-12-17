var PACKAGE = 'play-hanabi';
var BASE_URL = location.href;
if (BASE_URL.indexOf('?') != -1) {
	BASE_URL = BASE_URL.substring(0, BASE_URL.indexOf('?'));
}

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

function hint_btn_clicked()
{
	var box = this;
	while (!box.hasAttribute('data-seat-id') && box.parentNode) {
		box = box.parentNode;
	}
	var seatId = box.getAttribute('data-seat-id');

	$('#hint_dialog').attr('data-seat-id', seatId);

	$('#dimmer').show();
	$(box).addClass('selected_seat');
	$('#hint_dialog').show();
}

function hint_dlg_cancel()
{
	$('.selected_seat').removeClass('selected_seat');
	$('#hint_dialog').hide();
	$('#dimmer').hide();
}

function on_discard_event(evt)
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

			if ($box.length == 0) {
				var nextFun = function() {
					if (evt.newCard) {
						add_new_slot_my_hand(evt.newCard);
					}
				};
				remove_slot_my_hand(evt.handSlot, nextFun);
			}
			else {
				location.reload();
			}
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
	suspend_events();
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

function on_play_card_event(evt)
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

	var getNextCard = function() {

		if ($box.length == 0) {
			var nextFun = function() {
				if (evt.newCard) {
					add_new_slot_my_hand(evt.newCard);
				}
			};
			remove_slot_my_hand(evt.handSlot, nextFun);
		}
		else {
			location.reload();
		}
	};

	var hideStrikes = function() {
		$('#strike_dialog').hide();
		$('#dimmer').hide();
		$('.strike_clone').remove();

		var origPos = $('#play_area_box [data-suit="'+evt.suit+'"] .card_face').offset();
		var destPos = $('.discard_pile').offset();
		move_card_helper(origPos, destPos, function() {
			set_card($('.discard_pile .card_face'), evt.playCard);
			getNextCard();
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
			getNextCard();
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
	suspend_events();
	flashFn();
}

function add_new_slot_my_hand()
{
//TODO
	location.reload();
}

function remove_slot_my_hand(slot, andThen)
{
	$('.my_hand [data-slot="'+slot+'"]').hide('slow', function()
		{

		$('.my_hand [data-slot="'+slot+'"]').remove();
		shift_hint_table_columns(slot);
		andThen();
		});
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

function on_event(evt)
{
	if (evt.event == 'discard') {
		on_discard_event(evt);
	}
	else if (evt.event == 'play_card') {
		on_play_card_event(evt);
	}
	else {
		alert("got event: "+evt.message);
	}
}

var eventsSuspended = false;
function suspend_events()
{
	eventsSuspended = true;
}

var nextEventId = null;
var eventFetchErrorCount = 0;
function startEventSubscription()
{
	if (eventsSuspended) {
		return;
	}

	var queryArgs = get_query_args();
	var gameId = queryArgs.game;

	var onSuccess = function(data) {
		if (data.event) {
			on_event(data.event);
		}

		eventFetchErrorCount = 0;
		$('#ajaxErrorInd').hide();

		nextEventId = data.nextEvent;
		startEventSubscription();
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

function init_game_page_controls(game_data)
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
	var p = card.split('-');
	return 'cards/'+p[0]+'_'+p[1]+'.png';
}

function make_cards($box, card_array)
{
	for (var i = 0; i < card_array.length; i++) {
		var card = card_array[i];
		var $c = $('<img class="card_face">');
		$c.attr('src', get_card_image(card));
		$c.attr('alt', card);
		$c.attr('data-slot', i);
		$box.append($c);
	}
}

function init_game_page()
{
	var queryArgs = get_query_args();
	var gameId = queryArgs.game;

	var onSuccess = function(data) {
		init_game_page_controls(data);
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
}

function give_hint(seatId, hint)
{
	var queryArgs = get_query_args();
	var gameId = queryArgs.game;

	var onSuccess = function(data) {
		location.reload();
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
