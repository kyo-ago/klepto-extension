/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

window.onShown = function () {
	Deferred.parallel({
		'proxy' : getProxySettings,
		'storage' : loadStorage
	}).next(function (param) {
		$('#proxy_mode').changeProxySettings('#pac_script', param.proxy);
		$('#api_server').changeServerSettings(param.storage);
	});
};
$(function () {
	$('#proxy_mode').on('change', function () {
		$('#pac_script').toggle(!!$(this).attr('checked'));
	});
	$('#settings').applaySettings();
});

function loadStorage () {
	var defer = Deferred();
	chrome.storage.local.get(function(storage) {
		if (chrome.runtime.lastError) {
			alert(chrome.extension.lastError);
		}
		defer.call(storage);
	}.bind(this));
	return defer;
}

function saveStorage (data) {
	var defer = Deferred();
	chrome.storage.local.set(data, function() {
		if (!chrome.runtime.lastError) {
			return defer.call();
		}
		alert(chrome.extension.lastError);
		defer.fail();
	});
	return defer;
}

function getProxySettings () {
	var defer = Deferred();
	utils.sendMessage('getProxySettings', {}, defer.call.bind(defer));
	return defer;
}

jQuery.fn.applaySettings = function () {
	var self = $(this);

	self.on('submit', false).on('submit', function () {
		var save = saveStorage.bind(this, {
			'api_server' : $('#api_server').val(),
			'pac_script' : $('#pac_script').val()
		});

		if (!$('#proxy_mode').attr('checked')) {
			utils.sendMessage('clearProxySettings', {}, save);
			return;
		}
		var api_server = $('#api_server').val().split(':');
		var proxyForHttp = {
			'scheme' : 'http',
			'host' : api_server.shift(),
			'port' : parseInt(api_server.shift())
		};
		utils.sendMessage('setProxySettings', {
			'value' : {
				'mode' : 'fixed_servers',
				'rules' : {
					'proxyForHttp' : proxyForHttp
				}
			}
		}, save);
	});

	return self
};

jQuery.fn.changeServerSettings = function (setting) {
	var self = $(this);
	if (setting['api_server']) {
		self.val(setting['api_server']);
	}
	return self
};

jQuery.fn.changeProxySettings = function (pac, setting) {
	var self = $(this);
	pac = $(pac);

	self.statusEnable(true, '');
	self.attr('checked', null);
	pac.hide().val(setting.pac_script);
	if (setting.levelOfControl === 'not_controllable') {
		self.statusEnable(false, 'not controllable by this extension');
		return self;
	}
	if (setting.levelOfControl !== 'controlled_by_this_extension') {
		return self;
	}
	self.attr('checked', 'checked');
	pac.show();

	return self
};

jQuery.fn.statusEnable = function (enable, text) {
	var self = $(this);
	self
		.attr({
			'disabled' : enable ? null : 'disabled',
			'readonly' : enable ? null : 'readonly'
		})
		.nextAll('.status')
			.text(text)
	;
	return self
};
