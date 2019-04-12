sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Ticker", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("ticker").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "ticker");
			this.getView().bindElement("data>/Tickers(currency=\'BTC\',asset=\'XMR\')");
		},

		onRefreshPress: function() {
			this.getView().getElementBinding("data").refresh();
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
