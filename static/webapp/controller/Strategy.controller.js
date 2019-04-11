sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment"
], function (Controller, UIComponent, Fragment) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Strategy", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("strategy").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement("data>/Strategies(\'" + sId + "\')");
			// добавить draft

			this.getView().getModel("view").setProperty("/Draft", {
				currency: "BTC",
				asset: "XRP",
				period: "M1",
				length: 1000,
				balanceInitial: 100
			});
		},

		onAddBacktestPress: function() {
			var oView = this.getView();

			// create dialog lazily
			if (!this.byId("createBacktestDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "fokin.crypto.fragment.CreateBacktestDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);

					// подписаться на нажатие кнопки
					oDialog.open();
				});
			} else {
				this.byId("createBacktestDialog").open();
			}			
		},

		onCreateBacktestDialogOk: function() {
			this.byId("createBacktestDialog").close();
			// добавить индикатор загрузки, пока данные и модель обновляются

			// дождаться сохранения
			var oView = this.getView();
			var oDraft = oView.getModel("view").getProperty("/Draft");
			
			oView.byId("backtests").getBinding("items").create({
				balanceInitial: oDraft.balanceInitial,
				currency: oDraft.currency,
				asset: oDraft.asset,
				period: oDraft.period,
				begin: oDraft.begin,
				end: oDraft.end,
			}).created().then(function() {
				oView.getBindingContext("data").refresh();
			});
		},

		onCreateBacktestDialogCancel: function() {
			this.byId("createBacktestDialog").close();
		},

		onBacktestPress: function(oEvent) {
			UIComponent.getRouterFor(this).navTo("backtest", {
				id: oEvent.getParameters().listItem.getBindingContext("data").getProperty("_id")
			});
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
