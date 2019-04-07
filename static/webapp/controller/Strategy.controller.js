sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Strategy", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("strategy").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement("data>/Strategies(\'" + sId + "\')");
		},

		onAddBacktestPress: function(oEvent) {
			var oView = this.getView();
			oView.byId("backtests").getBinding("items").create({
				symbolFrom: "BTC",
				symbolTo: "XRP",
				period: "M1",
				length: 1000,
			}).created().then(function() {
				oView.getBindingContext("data").refresh();
			});

			// открыть диалог с опциями
			// добавить новый элемент
			// дождаться выполнения
			// закрыть диалог
		},

		onBacktestPress: function(oEvent) {
			UIComponent.getRouterFor(this).navTo("backtest", {
				id: oEvent.getParameters().listItem.getBindingContext("data").getProperty("_id")
			});
		}
	});
});
