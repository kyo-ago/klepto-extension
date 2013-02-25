/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

Deferred.onerror = function (e) {
	console.debug([e], e.stack);
};

var init_defers = {
	'ng' : Deferred(),
	'ch' : Deferred()
};
function appExtension ($scope) {
	init_defers.ng.call($scope);
}

window.onShown = utils.sendMessage.bind(utils, 'getProxySettings', {}, function (param) {
	init_defers.ch.call(param);
});
Deferred.parallel(init_defers).next(function (param) {
	var $scope = param.ng;
	var proxy = param.ch;
	$scope.apiServer = '127.0.0.1:8888';
	$scope.intervalTime = 1000;
	$scope.changeProxy = true;
	$scope.proxyDisable = false;
	$scope.apiServerStatus = undefined;
	$scope.proxyStatus = undefined;

	window.onShown = function () {
		utils.sendMessage('getProxySettings', {}, $scope.changeProxyStatus);
	};
	$scope.save = function () {
		var param = {
			'apiServer' : $scope.apiServer,
			'changeProxy' : $scope.changeProxy
		};
		$scope.setStorage(param)
			.next($scope.applayProxySettings.bind($scope, param))
			.next($scope.startConnection.bind($scope, param))
			.next($scope.$apply.bind($scope, 'save_success="fadeout"'))
		;
	};
	$scope.reset = function () {
		$scope.getStorage.next(function (storage) {
			['apiServer', 'changeProxy'].forEach(function (key) {
				if (key in storage) {
					$scope[key] = storage[key];
				}
			});
			$scope.$apply();
		});
	};
	$scope.getStorage = function () {
		var defer = Deferred();
		chrome.storage.local.get(function(storage) {
			if (chrome.runtime.lastError) {
				alert(chrome.extension.lastError);
				defer.fail();
				return;
			}
			defer.call(storage);
		});
		return defer;
	};
	$scope.setStorage = function (param) {
		var defer = Deferred();
		chrome.storage.local.set(param, function() {
			if (chrome.runtime.lastError) {
				alert(chrome.extension.lastError);
				defer.fail();
				return;
			}
			defer.call();
		});
		return defer;
	};

	$scope.applayProxySettings = function (param) {
		var defer = Deferred();

		if (!param.changeProxy) {
			$scope.disableProxy().next(defer.call.bind(defer));
			return;
		}
		var api_server = param.apiServer.split(':');
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
		}, defer.call.bind(defer));

		return defer;
	};
	$scope.disableProxy = function () {
		var defer = Deferred();

		utils.sendMessage('clearProxySettings', {}, function () {
			utils.sendMessage('stopConnection', {}, function () {
				defer.call();
			});
		});

		return defer;
	};
	$scope.changeProxyStatus = function (param) {
		if (param.levelOfControl === 'not_controllable') {
			$scope.proxyStatus = 'not controllable by this extension';
			$scope.proxyDisable = true;
			$scope.changeProxy = false;
		}
		if (param.levelOfControl === 'controlled_by_this_extension') {
			$scope.changeProxy = true;
		}
	};
	$scope.startConnection = function (param) {
		var defer = Deferred();
		utils.sendMessage('startConnection', param, defer.call.bind(defer));
		return defer;
	};
	$scope.checkConnection = function () {
		$scope.intervalId && clearInterval($scope.intervalId);
		$scope.intervalId = setInterval(function () {
			utils.sendMessage('getConnectionStatus', {}, function (readyState) {
				Object.keys(WebSocket).filter(function (key) {
					return WebSocket[key] === readyState;
				}).forEach(function (state) {
					$scope.$apply('ApiServerStatus="Klepto server states ' + state + '"');
				});
			});
		}, $scope.intervalTime);
	};
	$scope.initSettings = function () {
		if (!$scope.apiServer) {
			return;
		}
		$scope.getStorage().next(function (storage) {
			if (!storage) {
				return;
			}
			['apiServer', 'changeProxy'].forEach(function (key) {
				if (key in storage) {
					$scope[key] = storage[key];
				}
			});
			$scope.startConnection({
				apiServer : storage.apiServer
			}).next($scope.checkConnection);
		});
	};
	$scope.changeProxyStatus(proxy);
	$scope.initSettings();

	if (!$scope.$$phase) {
		$scope.$apply();
	}
});
