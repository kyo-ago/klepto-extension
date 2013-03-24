Deferred.parallel({
	'back' : function () {
		var defer = Deferred();
		chrome.runtime.getBackgroundPage(function (back) {
			defer.call(back);
		});
		return defer;
	},
	'tab' : function () {
		var defer = Deferred();
		chrome.tabs.getSelected(function (tab) {
			defer.call(tab);
		});
		return defer;
	}
}).next(function (param) {
	var back = param.back;
	var tab = param.tab;
	back.toggleProxyTab(tab);
});
