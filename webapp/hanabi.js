function commonError(jqXHR, textStatus, errorThrown)
{
	alert("ajax error: "+textStatus+" "+errorThrown);
}

function do_login()
{
	var onSuccess = function(data) {
		var sid = data.sid;
		alert("sid is "+sid);
	};

	alert("user entered "+document.login_form.username.value);
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

	//location.href = "page2.html";
}
