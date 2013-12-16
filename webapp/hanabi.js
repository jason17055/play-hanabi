var PACKAGE = 'play-hanabi';
var BASE_URL = location.href;
if (BASE_URL.indexOf('?') != -1) {
	BASE_URL = BASE_URL.substring(0, BASE_URL.indexOf('?'));
}

function commonError(jqXHR, textStatus, errorThrown)
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
	alert("giving hint to player at seat "+seatId);

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

function init_game_page_controls(game_data)
{
	var mySeat = null;

	$('.cards_left_ind').text(game_data.drawPile);
	$('.hints_left_ind').text(game_data.hintsLeft);

	for (var i = 0; i < game_data.seats.length; i++) {
		var seat = game_data.seats[i];
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

	if (document.getElementById('game_page')) {
		init_game_page();
	}
});

function play_card(slot)
{
	var queryArgs = get_query_args();
	var gameId = queryArgs.game;

	var onSuccess = function(data) {
		alert(data.message);
		location.reload();
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
		alert(data.message);
		location.reload();
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
