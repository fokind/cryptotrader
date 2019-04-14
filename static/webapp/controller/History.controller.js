sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.History", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("history").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "histories");
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement({
				model: "data",
				path: `/Histories(\'${sId}\')`
			});
		},

		onRefreshPress: function() {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			var oOperation = oModel.bindContext(sPath + "/Crypto.update(...)");
			oOperation.execute().then(function() {
				oModel.refresh();
			}.bind(this));
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
