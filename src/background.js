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
var global = this;
global.WS = {};
global.proxy = {};
global.storage = {};
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
			global.storage = storage;
			defer.call();
		});
	});
	return defer;
}
function reconnectServer () {
	connectionServer();
}
function connectionServer () {
	if (global.storage.disableServer) {
		return;
	}
	var defer = Deferred();
	if (global.WS) {
		global.WS.close();
		global.WS = undefined;
	}
	global.WS = new WebSocket('ws://' + global.storage.apiServer + '/');
	global.WS.addEventListener('open', defer.call.bind(defer, ws));
	global.WS.addEventListener('close', reconnectServer);
	global.WS.addEventListener('message', function (evn) {
		var data = JSON.parse(evn.data);
		if (data.type === 'command' && data.command === 'pageReload') {
			chrome.tabs.reload();
		}
	});
	return defer;
}
function getProxy () {
	var defer = Deferred();
	chrome.proxy.settings.get({}, function (proxy) {
		global.proxy = proxy;
		defer.call();
	});
	return defer;
}
function setProxy () {
	if (global.storage.disableProxy) {
		return;
	}
	if (global.proxy.levelOfControl === 'not_controllable') {
		return;
	}
	if (global.proxy.levelOfControl === 'controlled_by_this_extension') {
		return;
	}
	var defer = Deferred();
	var rules = {
		'proxyForHttp' : {
			'scheme' : 'http',
			'host' : global.storage.proxyHost,
			'port' : parseInt(global.storage.proxyPort)
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
function sendMessage (message) {
	if (!global.WS) {
		return false;
	}
	if (chrome.extension.lastError) {
		alert(chrome.extension.lastError);
		return false;
	}
	if (message['command'] !== 'saveFile') {
		return false;
	}
	global.WS.send(JSON.stringify({
		'type' : 'save',
		'file' : {
			'path' : message.file.url,
			'data' : message.file.text
		}
	}));
	return false;
}
function onMessageListener () {
	chrome.extension.onMessage.addListener(sendMessage.bind(this));
}
function Initialize () {
	return Deferred.next(getStorage).next(function () {
		return Deferred.parallel({
			'socket' : connectionServer.bind(self),
			'proxy' : function () {
				return getProxy()
					.next(setProxy.bind(self))
				;
			}
		}).next(onMessageListener);
	});
}
Initialize();
