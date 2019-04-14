sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment"
], function (Controller, UIComponent, Fragment) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Histories", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("histories").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "histories");
			this.getView().getModel("view").setProperty("/HistoryDraft", {
				name: "",
			});
		},

		onItemPress: function(oEvent) {
			UIComponent.getRouterFor(this).navTo("history", {
				id: oEvent.getParameters().listItem.getBindingContext("data").getProperty("_id")
			});
		},

		onAddPress: function() {
			var oView = this.getView();
			if (!this.byId("dialog")) {
				Fragment.load({
					id: oView.getId(),
					name: "fokin.crypto.fragment.AddHistoryDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("dialog").open();
			}			
		},

		onOkPress: function() {
			this.byId("dialog").close();
			var oView = this.getView();
			var oDraft = oView.getModel("view").getProperty("/HistoryDraft");

			oView.byId("histories").getBinding("items").create({
				currency: oDraft.currency,
				asset: oDraft.asset,
				period: oDraft.period,
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
