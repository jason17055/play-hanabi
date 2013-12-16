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

function init_game_page_controls(game_data)
{
	var mySeat = null;

	for (var seatNum in game_data.seats) {
		var seat = game_data.seats[seatNum];
		if (seat.isYou) {
			mySeat = seat;
			continue;
		}

		$x = $('.other_player.template').clone();
		$x.removeClass('template');
		$x.attr('data-seat-id', seatNum);
		$('.player_name', $x).text(seat.playerName);
		make_cards($('.cards', $x), seat.hand);
		$('.other_players_area').append($x);
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
