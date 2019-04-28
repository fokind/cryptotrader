sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel"
], function (Controller, UIComponent, Fragment, JSONModel) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Strategy", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("strategy").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "strategies");
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement("data>/Strategies(\'" + sId + "\')");
		},

		onAddBacktestPress: function() {
			var oView = this.getView();
			if (!this.byId("addBacktestDialog")) {
				Fragment.load({
					id: oView.getId(),
					name: "fokin.crypto.fragment.AddBacktestDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.setModel(new JSONModel({
						balanceInitial: 1
					}), "draft");
					oDialog.open();
				});
			} else {
				this.byId("addBacktestDialog").open();
			}		
		},

		onAddBacktestDialogOk: function() {
			var oDialog = this.byId("addBacktestDialog");
			var oView = this.getView();
			var oDraft = oDialog.getModel("draft").getData();
			oDialog.close();

			var oBinding = oView.byId("backtests").getBinding("items");
			var oContext = oBinding.create({
				balanceInitial: oDraft.balanceInitial,
				marketDataId: oDraft.marketDataId,
				begin: oDraft.begin,
				end: oDraft.end,
			});
			
			oContext.created().then(function() {
				oBinding.refresh();
			});
		},

		onAddBacktestDialogCancel: function() {
			this.byId("addBacktestDialog").close();
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
