sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Ticker", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("ticker").attachPatternMatched(this.onRouteMatched, this);
		},

		_bindElement: function() {
			var oViewModel = this.getView().getModel("view");
			var sCurrency = oViewModel.getProperty("/currency");
			var sAsset = oViewModel.getProperty("/asset");
			this.getView().bindElement(`data>/Tickers(currency=\'${sCurrency}\',asset=\'${sAsset}\')`);
		},

		onRouteMatched: function() {
			this.getView().getModel("view").setProperty("/tab", "ticker");
			this._bindElement();
		},

		refresh: function() {
			this.getView().getElementBinding("data").refresh();
		},

		onCurrencyChange: function() {
			this._bindElement();
		},

		onAssetChange: function() {
			this._bindElement();
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
