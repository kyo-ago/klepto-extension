/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

var ws = new WebSocket('ws://127.0.0.1:24888/');
ws.onmessage = function(data) {
	var param = JSON.stringify(data);
	if (param.type !== 'message') {
		return;
	}
	console.log(param.message);
};
utils.onCommandsMessage({
	'getProxySettings' : function (param, callback) {
		chrome.proxy.settings.get(param || {}, callback);
	},
	'setProxySettings' : function (param, callback) {
		chrome.proxy.settings.set(param, callback);
	},
	'clearProxySettings' : function (param, callback) {
		chrome.proxy.settings.clear(param || {}, callback);
	},
	'onResourceContentCommitted' : function (param) {
		ws.send(JSON.stringify({
			'type' : 'save',
			'file' : {
				'path' : param.url,
				'data' : param.text
			}
		}));
	}
});