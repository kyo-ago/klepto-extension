/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

var DefaultSettings = {
	'disableProxy' : false,
	'disableServer' : false,
	'apiServer' : '127.0.0.1:8888',
	'proxyHost' : '127.0.0.1',
	'proxyPort' : 8888
};
function getStorage () {
	var defer = Deferred();
	chrome.storage.local.get(function (storage) {
		Object.keys(DefaultSettings).forEach(function (key) {
			storage[key] = key in storage
				? storage[key]
				: DefaultSettings[key]
			;
		});
		chrome.storage.local.set(storage, function() {
			if (chrome.runtime.lastError) {
				alert(chrome.extension.lastError);
				return;
			}
			defer.call(storage);
		});
	});
	return defer;
}
function connectionServer (storage) {
	if (storage.disableServer) {
		return;
	}
	var defer = Deferred();
	var ws = new WebSocket('ws://' + storage.apiServer + '/');
	ws.addEventListener('open', defer.call.bind(defer, ws));
	ws.addEventListener('message', function (evn) {
		var data = JSON.parse(evn.data);
		if (data.type === 'command' && data.command === 'pageReload') {
			chrome.tabs.reload();
		}
	});
	return defer;
}
function getProxy () {
	var defer = Deferred();
	chrome.proxy.settings.get({}, defer.call.bind(defer));
	return defer;
}
function setProxy (storage, proxy) {
	if (storage.disableProxy) {
		return;
	}
	if (proxy.levelOfControl === 'not_controllable') {
		return;
	}
	if (proxy.levelOfControl === 'controlled_by_this_extension') {
		return;
	}
	var defer = Deferred();
	var rules = {
		'proxyForHttp' : {
			'scheme' : 'http',
			'host' : storage.proxyHost,
			'port' : parseInt(storage.proxyPort)
		}
	};
	chrome.proxy.settings.set({
		'value' : {
			'mode' : 'fixed_servers',
			'rules' : rules
		}
	}, defer.call.bind(defer));
	return defer;
}
function sendMessage (socket, message, sender, sendResponse) {
	if (!socket) {
		return false;
	}
	if (chrome.extension.lastError) {
		alert(chrome.extension.lastError);
		return false;
	}
	if (message['command'] !== 'saveFile') {
		return false;
	}
	socket.addEventListener('message', function (evn) {
		var data = JSON.parse(evn.data);
		if (data.type === 'command' && data.command === 'saveSuccess') {
			sendResponse(data);
		}
	});
	socket.send(JSON.stringify({
		'type' : 'save',
		'file' : {
			'path' : message.file.url,
			'data' : message.file.text
		}
	}));
	return true;
}

function Initialize (self) {
	return Deferred.next(getStorage).next(function (storage) {
		var defer = Deferred();
		if (self.WS) {
			self.WS.close();
			self.WS = undefined;
		}
		Deferred.parallel({
			'socket' : connectionServer.bind(this, storage),
			'proxy' : function () {
				return getProxy(storage)
					.next(setProxy.bind(this, storage))
				;
			}
		}).next(function (result) {
			self.WS = result.socket;
			defer.call(result);
		});
		return defer;
	}).next(function (param) {
		chrome.extension.onMessage.addListener(sendMessage.bind(this, param.socket));
	});
}
Initialize(this);
