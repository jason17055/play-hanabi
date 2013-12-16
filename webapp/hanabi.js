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
		url: 's/login',
		data: {
			name: document.login_form.username.value
			},
		dataType: 'json',
		success: onSuccess,
		error: commonError,
		type: 'POST'
		});
}

$(function() {
	$('.remote_user').text(
		sessionStorage.getItem(PACKAGE+'.sid')
		);
});
