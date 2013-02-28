/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

Deferred.onerror = function (e) {
	console.debug([e], e.stack);
};

function makeInitDefers () {
	var defers = {
		'$scope' : Deferred(),
		'bg' : Deferred(),
		'stor' : Deferred(),
		'proxy' : Deferred()
	};
	angular.module('ng').controller('appExtension', ['$scope', function ($scope) {
		defers.$scope.call($scope);
	}]);
	chrome.runtime.getBackgroundPage(defers.bg.call.bind(defers.bg));
	chrome.storage.local.get(defers.stor.call.bind(defers.stor));
	chrome.proxy.settings.get({}, defers.proxy.call.bind(defers.proxy));
	return defers;
}
function initValue ($scope, storage) {
	$scope.apiServer = storage.apiServer;
	$scope.proxyServer = storage.proxyHost + ':' + storage.proxyPort;
	$scope.disableServer = storage.disableServer;
	$scope.disableProxy = storage.disableProxy;
}

Deferred.parallel(makeInitDefers()).next(function (param) {
	var $scope = param.$scope;
	var background = param.bg;
	var storage = param.stor;
	var proxy = param.proxy;

	initValue($scope, storage);

	$scope.changeProxy = function (proxy) {
		if (proxy.levelOfControl !== 'not_controllable') {
			return;
		}
		$scope.proxyStatus = 'not controllable by this extension';
		$scope.proxyReadony = true;
		$scope.disableProxy = false;
	};
	$scope.checkWSState = function () {
		var readyState = background.WS.readyState;
		Object.keys(WebSocket).filter(function (key) {
			return WebSocket[key] === readyState;
		}).forEach(function (state) {
			$scope.$apply('ApiServerStatus="Klepto server states ' + state + '"');
		});
	};
	$scope.setStorage = function (param) {
		var defer = Deferred();
		chrome.storage.local.set(param, function() {
			if (chrome.runtime.lastError) {
				alert(chrome.extension.lastError);
				return;
			}
			defer.call();
		});
		return defer;
	};
	$scope.save = function () {
		var proxyServer = $scope.proxyServer.split(':');
		$scope.setStorage({
			'disableServer' : $scope.disableServer,
			'disableProxy' : $scope.disableProxy,
			'apiServer' : $scope.apiServer,
			'proxyHost' : proxyServer[0],
			'proxyPort' : proxyServer[1]
		}).next(background.Initialize).next(function () {
			$scope.$apply('save_success="fadeout"');
		});
	};
	$scope.reset = function () {
		chrome.storage.local.get(initValue.bind(this, $scope));
	};

	$scope.changeProxy(proxy);
	$scope.interval = setInterval($scope.checkWSState, 5000);
	if (!$scope.$$phase) {
		$scope.$apply();
	}
});
