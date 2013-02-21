/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

var utils = {};
utils.onCommandsMessage = function (commands) {
	chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
		if (chrome.extension.lastError) {
			alert(chrome.extension.lastError);
			return false;
		}
		if (!commands[message['command']]) {
			alert('illegal command');
			return false;
		}
		var command = message['command'];
		delete message['command'];
		commands[command](message, sendResponse);
		return true;
	});
};
utils.sendMessage = function (command, param, callback) {
	param['command'] = command;
	chrome.extension.sendMessage(param, callback);
};
