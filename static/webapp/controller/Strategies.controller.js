sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Strategies", {
		onItemPress: function(oEvent) {
			UIComponent.getRouterFor(this).navTo("strategy", {
				id: oEvent.getParameters().listItem.getBindingContext("data").getProperty("_id")
			});
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
