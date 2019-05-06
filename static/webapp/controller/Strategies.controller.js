sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel"
], function (Controller, UIComponent, Fragment, JSONModel) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Strategies", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("strategies").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "strategies");
		},

		onItemPress: function(oEvent) {
			UIComponent.getRouterFor(this).navTo("strategy", {
				id: oEvent.getParameters().listItem.getBindingContext("data").getProperty("_id")
			});
		},

		onAddStrategyPress: function() {
			var oView = this.getView();
			if (!this.byId("dialog")) {
				Fragment.load({
					id: oView.getId(),
					name: "fokin.crypto.fragment.AddStrategyDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.setModel(new JSONModel({
						name: "",
					}), "draft");
					oDialog.open();
				});
			} else {
				this.byId("dialog").open();
			}			
		},

		onOk: function() {
			var oDialog = this.byId("dialog");
			var oView = this.getView();
			var oDraft = oDialog.getModel("draft").getData();
			oDialog.close();

			var oBinding = oView.byId("strategies").getBinding("items");
			var oContext = oBinding.create({
				name: oDraft.name,
				Indicator: {
					name: oDraft.indicatorName,
					options: oDraft.indicatorOptions
				}
			});
			
			oContext.created().then(function() {
				oBinding.refresh();
			});
		},

		onCancel: function() {
			this.byId("dialog").close();
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
