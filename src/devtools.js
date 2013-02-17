chrome.devtools.panels.create(' Klepto ', '/img/logo.png', '/html/panel.html', function(panel){
	panel.onShown.addListener(function (win) {
	});
});
var enable_auto_save = false;
chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(function(evn, text) {
	if (!enable_auto_save) {
		return;
	}
	/*
		evn = {
			'url' : 'http://example.com/hoge.xxx',
			'type' : 'stylesheet' or 'script'
		};
	*/
	evn.text = text;
	var param = Object.keys(evn).map(function (key) {
		return [encodeURIComponent(key), encodeURIComponent(evn[key])].join('=');
	}).join('&');
	var url = evn.url;
	var req = new XMLHttpRequest();
	req.onreadystatechange = function () {
		if (req.readyState !== 4 || req.status !== 200) {
			return;
		}
		var json = JSON.parse(req.responseText);
		if (json['result'] !== 'ok') {
			alert(['error', JSON.stringify(json)].join('\n'));
		}
	};
	req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	req.open('POST', 'http://localhost:24888/autosave/?url='+encodeURIComponent(url));
	req.send(param);
});
