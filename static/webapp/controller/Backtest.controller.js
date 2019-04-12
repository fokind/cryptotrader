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
			this.getView().getModel("view").setProperty("/tab", "strategies");
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement({
				model: "data",
				path: "/Backtests(\'" + sId + "\')",
				parameters: {
					"$select": "strategyId"
				}
			});
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
