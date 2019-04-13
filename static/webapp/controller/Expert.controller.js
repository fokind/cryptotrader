sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Expert", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("expert").attachPatternMatched(this.onRouteMatched, this);
		},

		_bindElement: function() {
			var oViewModel = this.getView().getModel("view");
			var sCurrency = oViewModel.getProperty("/currency");
			var sAsset = oViewModel.getProperty("/asset");
			var sPeriod = oViewModel.getProperty("/period");
			this.getView().bindElement(`data>/Experts(currency=\'${sCurrency}\',asset=\'${sAsset}\',period=\'${sPeriod}\')`);
		},

		onRouteMatched: function() {
			this.getView().getModel("view").setProperty("/tab", "expert");
			this._bindElement();
		},

		refresh: function() {
			this.getView().getElementBinding("data").refresh();
		},

		onCurrencyChange: function() {
			this._bindElement();
		},

		onAssetChange: function() {
			this._bindElement();
		},

		onPeriodChange: function() {
			this._bindElement();
		},

		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
