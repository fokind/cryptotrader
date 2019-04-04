sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Candles", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("candles").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			var mArguments = oEvent.getParameter("arguments");
			var sId = "5ca64b119c56d015c8827169";// mArguments.id;
			this.getView().bindElement("data>/History(\'" + sId + "\')");
		}
	});
});
