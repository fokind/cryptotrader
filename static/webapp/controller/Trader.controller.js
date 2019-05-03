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
			this.getView().getModel("view").setProperty("/tab", "traders");
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement({
				model: "data",
				path: "/Traders(\'" + sId + "\')",
				parameters: {
					"$select": "expertId,accountId",
					"$expand": "Expert($select=marketDataId,strategyId)"
				}
			});
		},

		onSynchronizePress: function() {
			this.getView().getElementBinding("data").refresh();
		},

		onRefreshPress: function() {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			var oOperation = oModel.bindContext(sPath + "/Crypto.update(...)");
			oOperation.execute().then(function() {
				oModel.refresh(); // заменить на обновление только связанных элементов
			}.bind(this));
		},

		onStartPress: function() {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			var oOperation = oModel.bindContext(sPath + "/Crypto.start(...)");
			oOperation.execute().then(function() {
				oModel.refresh(); // заменить на обновление только связанных элементов
			}.bind(this));
		},

		onStopPress: function() {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			var oOperation = oModel.bindContext(sPath + "/Crypto.stop(...)");
			oOperation.execute().then(function() {
				oModel.refresh(); // заменить на обновление только связанных элементов
			}.bind(this));
		},

		onCancelPress: function() {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			var oOperation = oModel.bindContext(sPath + "/Crypto.cancel(...)");
			oOperation.execute().then(function() {
				oModel.refresh(); // заменить на обновление только связанных элементов
			}.bind(this));
		},

		onBuyPress: function(oEvent) {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			var oOperation = oModel.bindContext(sPath + "/Crypto.buy(...)");
			oOperation.execute().then(function() {
				oModel.refresh(); // заменить на обновление только связанных элементов
			}.bind(this));
		},

		onSellPress: function() {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			var oOperation = oModel.bindContext(sPath + "/Crypto.sell(...)");
			oOperation.execute().then(function() {
				oModel.refresh(); // заменить на обновление только связанных элементов
			}.bind(this));
		},

		onSellMarketPress: function() {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();

			$.ajax({
				contentType: 'application/json',
				data: JSON.stringify(true),
				dataType: 'json',
				success: function() {
					oModel.refresh(); // TODO обновлять только свечи
				},
				processData: false,
				type: 'POST',
				url: "/odata" + sPath + "/Crypto.sell"
			});
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
