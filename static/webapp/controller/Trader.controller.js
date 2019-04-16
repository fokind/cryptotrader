sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Trader", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("trader").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "tarders");
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement({
				model: "data",
				path: "/Traders(\'" + sId + "\')",
				parameters: {
					"$select": "expertId",
					"$expand": "Expert($select=historyId,strategyId)"
				}
			});
		},

		onSynchronizePress: function() {
			this.getView().getElementBinding("data").refresh();
		},

		onRefreshPress: function() {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			var oOperation = oModel.bindContext(sPath + "/Expert/Crypto.update(...)");
			oOperation.execute().then(function() {
				oModel.refresh(); // заменить на обновление только связанных элементов
			}.bind(this));
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
