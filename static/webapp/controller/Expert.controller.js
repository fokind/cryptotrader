sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Expert", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("expert").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "experts");
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement({
				path: "data>/Experts(\'" + sId + "\')",
				parameters: {
					"$select": "historyId,strategyId"
				}
			});
		},

		refresh: function() {
			this.getView().getElementBinding("data").refresh();
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
