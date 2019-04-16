sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Account", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("account").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "accounts");
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement({
				model: "data",
				path: "/Accounts(\'" + sId + "\')"
			});
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
