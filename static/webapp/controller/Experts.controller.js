sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel"
], function (Controller, UIComponent, Fragment, JSONModel) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Experts", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("experts").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "experts");
		},

		onItemPress: function(oEvent) {
			UIComponent.getRouterFor(this).navTo("expert", {
				id: oEvent.getParameters().listItem.getBindingContext("data").getProperty("_id")
			});
		},

		onAddPress: function() {
			var oView = this.getView();
			if (!this.byId("dialog")) {
				Fragment.load({
					id: oView.getId(),
					name: "fokin.crypto.fragment.AddExpertDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.setModel(new JSONModel(), "draft");
					oDialog.open();
				});
			} else {
				this.byId("dialog").open();
			}			
		},

		onOkPress: function() {
			var oDialog = this.byId("dialog");
			var oView = this.getView();
			var oDraft = oDialog.getModel("draft").getData();
			oDialog.close();

			oView.byId("experts").getBinding("items").create({
				marketDataId: oDraft.marketDataId,
				strategyId: oDraft.strategyId,
			}).created().then(function() {
				oView.getBindingContext("data").refresh();
			});
		},

		onCancelPress: function() {
			this.byId("dialog").close();
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
