sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Backtest", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("backtest").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement("data>/Backtests(\'" + sId + "\')");
		},

		onUpdatePress: function(oEvent) {
			var oView = this.getView();
			oView.getModel("data")
				.bindContext(oView.getBindingContext("data") + "/Crypto.update(...)")
				.execute(); // .then(...
		}
	});
});
