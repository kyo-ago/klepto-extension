/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

chrome.devtools.inspectedWindow.onResourceContentCommitted.addListener(function(evn, text) {
	/*
		evn = {
			'url' : 'http://example.com/hoge.xxx',
			'type' : 'stylesheet' or 'script'
		};
	 */
	evn.text = text;
	utils.sendMessage('onResourceContentCommitted', evn, function () {});
});
