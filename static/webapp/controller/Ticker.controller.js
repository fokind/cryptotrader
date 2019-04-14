sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Ticker", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("ticker").attachPatternMatched(this.onRouteMatched, this);
		},

		_bindTicker: function() {
			var sCurrency = this.getView().getModel("view").getProperty("/tickerCurrency");
			var sAsset = this.getView().getModel("view").getProperty("/tickerAsset");
			this.getView().bindElement("data>/Tickers(currency=\'" + sCurrency + "\',asset=\'" + sAsset + "\')");
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "ticker");
			this.getView().getModel("view").setProperty("/tickerCurrency", "BTC"); // временно, только для примера
			this.getView().getModel("view").setProperty("/tickerAsset", "ETH"); // временно, только для примера
			this._bindTicker();
		},

		onTickerChange: function() {
			this._bindTicker();
		},

		onRefreshPress: function() {
			this.getView().getElementBinding("data").refresh();
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
