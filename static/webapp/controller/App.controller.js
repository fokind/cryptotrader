sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";
	
	return Controller.extend("fokin.crypto.controller.App", {
		onTabSelect: function(oEvent) {
			UIComponent.getRouterFor(this).navTo(oEvent.getParameter("key"));
		}
	});
});
