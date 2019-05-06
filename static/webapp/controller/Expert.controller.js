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
				model: "data",
				path: "/Experts(\'" + sId + "\')",
				parameters: {
					"$select": "marketDataId,strategyId"
				}
			});
		},

		onRefreshPress: function() {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			var oOperation = oModel.bindContext(sPath + "/Crypto.update(...)"); // каждый раз заново?
			oOperation.execute().then(function() {
				oModel.refresh(); // TODO заменить на обновление только связанных элементов
			}.bind(this));
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
