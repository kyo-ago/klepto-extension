/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

chrome.devtools.panels.create(' Klepto ', '/img/logo.png', '/html/panel.html', function(panel){
	panel.onShown.addListener(function (win) {
		win.onShown();
	});
});

chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(function(evn, text) {
	/*
		evn = {
			'url' : 'http://example.com/hoge.xxx',
			'type' : 'stylesheet' or 'script'
		};
	 */
	evn.text = text;
	utils.sendMessage('onResourceContentCommitted', evn, function () {
		alert('save');
	});
});
