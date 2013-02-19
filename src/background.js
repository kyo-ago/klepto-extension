/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

utils.onCommandsMessage({
	'getProxySettings' : function (param, callback) {
		chrome.proxy.settings.get(param || {}, callback);
	},
	'setProxySettings' : function (param, callback) {
		chrome.proxy.settings.set(param, callback);
	},
	'clearProxySettings' : function (param, callback) {
		chrome.proxy.settings.clear(param || {}, callback);
	}
});