sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel"
], function (Controller, UIComponent, Fragment, JSONModel) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Accounts", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("accounts").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "accounts");
		},

		onItemPress: function(oEvent) {
			UIComponent.getRouterFor(this).navTo("account", {
				id: oEvent.getParameters().listItem.getBindingContext("data").getProperty("_id")
			});
		},

		onAddPress: function() {
			var oView = this.getView();
			if (!this.byId("dialog")) {
				Fragment.load({
					id: oView.getId(),
					name: "fokin.crypto.fragment.AddAccountDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.setModel(new JSONModel({
						Credentials: [ // TODO должно задаваться по шаблону для выбранной биржи
							{ name: "API" },
							{ name: "SECRET" }
						]
					}), "draft");
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

			var oBinding = oView.byId("accounts").getBinding("items");
			var oContext = oBinding.create({
				name: oDraft.name,
				Credentials: oDraft.Credentials
			});
			
			oContext.created().then(function() {
				oBinding.refresh();
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
