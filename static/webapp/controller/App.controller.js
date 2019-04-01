sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	"use strict";
	
	return Controller.extend("fokin.crypto.controller.App", {
		onInit: function() {
			console.log(1);
		},

		onAdd: function(oEvent) {
			// var oList = oEvent.getSource().getParent().getParent();
      // var oBinding = oList.getBinding("items");
      // var oContext = oBinding.create({
      //   "Name": "n",
      //   "Age": 1,
      //   "Lives": 3,
      //   "Owner": "o"
			// });
			// console.log(oContext);
			// oBinding.refresh();
      // oContext.created().then(() => {
			// 	console.log(oContext);
      // });
		}
	});
});
