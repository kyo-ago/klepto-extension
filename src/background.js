/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

var ws;
function pageReload (param, ws) {
	chrome.tabs.reload();
}
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
	'startConnection' : function (param, callback) {
		ws && ws.close();
		ws = new WebSocket('ws://' + param.apiServer + '/');
		ws.onopen = callback;
		ws.onmessage = function (evn) {
			var param = JSON.parse(evn.data);
			if (!param.type) {
				return;
			}
			if (param.type === 'message') {
				console.debug(param.message);
			}
			if (param.type === 'command') {
				pageReload(param, ws);
			}
		};
	},
	'getConnectionStatus' : function (param, callback) {
		callback(ws ? ws.readyState : WebSocket.CLOSED);
	},
	'stopConnection' : function (param, callback) {
		ws && ws.close();
		ws = undefined;
	},
	'consoledebug' : function (param) {
		consoledebug(param)
	},
	'onResourceContentCommitted' : function (param, callback) {
		ws.onopen = callback;
		ws.send(JSON.stringify({
			'type' : 'save',
			'file' : {
				'path' : param.url,
				'data' : param.text
			}
		}));
	}
});