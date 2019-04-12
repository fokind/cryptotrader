sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment"
], function (Controller, UIComponent, Fragment) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Strategies", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("strategies").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "strategies");
			this.getView().getModel("view").setProperty("/StrategyDraft", {
				name: "",
			});
		},

		onItemPress: function(oEvent) {
			UIComponent.getRouterFor(this).navTo("strategy", {
				id: oEvent.getParameters().listItem.getBindingContext("data").getProperty("_id")
			});
		},

		onAddStrategyPress: function() {
			var oView = this.getView();
			if (!this.byId("createStrategyDialog")) {
				Fragment.load({
					id: oView.getId(),
					name: "fokin.crypto.fragment.CreateStrategyDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("createStrategyDialog").open();
			}			
		},

		onCreateStrategyDialogOk: function() {
			this.byId("createStrategyDialog").close();
			var oView = this.getView();
			var oDraft = oView.getModel("view").getProperty("/StrategyDraft");
			oView.byId("strategies").getBinding("items").create({
				name: oDraft.name,
			}).created().then(function() {
				oView.getBindingContext("data").refresh();
			});
		},

		onCreateStrategyDialogCancel: function() {
			this.byId("createStrategyDialog").close();
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
