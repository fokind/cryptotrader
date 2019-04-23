/* global moment */

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel"
], function (Controller, UIComponent, Fragment, JSONModel) {
	"use strict";

	return Controller.extend("fokin.crypto.controller.Candles", {
		onInit: function() {
			UIComponent.getRouterFor(this).getRoute("candles").attachPatternMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function(oEvent) {
			this.getView().getModel("view").setProperty("/tab", "marketData");
			var mArguments = oEvent.getParameter("arguments");
			var sId = mArguments.id;
			this.getView().bindElement({
				model: "data",
				path: `/MarketData(\'${sId}\')`
			});
		},

		onRefreshPress: function() {
			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			var oOperation = oModel.bindContext(sPath + "/Crypto.update(...)");
			oOperation.execute().then(function() {
				oModel.refresh();
			}.bind(this));
		},

		onImportCandlesPress: function() {
			var oView = this.getView();
			if (!this.byId("importCandlesDialog")) {
				Fragment.load({
					id: oView.getId(),
					name: "fokin.crypto.fragment.ImportCandlesDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.setModel(new JSONModel({
						begin: moment({
							year: moment().year(),
							month: moment().month(),
							day: moment().date()
						}).add(-1, 'd'),
						end: moment({
							year: moment().year(),
							month: moment().month(),
							day: moment().date()
						}).add(-1, 'm')
					}), "draft");
					oDialog.open();
				});
			} else {
				this.byId("importCandlesDialog").open();
			}		
		},

		onCalendarSelect: function(oEvent) {
			var oDialog = this.byId("importCandlesDialog");
			var oDraftModel = oDialog.getModel("draft");

			var oCalendar = oEvent.getSource();
			var oSelectedDates = oCalendar.getSelectedDates()[0];
			if (oSelectedDates) {
				var dStartDate = oSelectedDates.getStartDate();
				var dBegin = moment.utc(Date.UTC(dStartDate.getFullYear(), dStartDate.getMonth(), dStartDate.getDate())).toDate();

				// console.log(dStartDate, dStartDate.getUTCDate(), Date.UTC(dStartDate.getUTCFullYear(), dStartDate.getUTCMonth(), dStartDate.getUTCDate()), moment.utc(Date.UTC(dStartDate.getUTCFullYear(), dStartDate.getUTCMonth(), dStartDate.getUTCDate())).toDate());
				oDraftModel.setProperty("/begin", dBegin); // FIXME исключить влияние часового пояса
				var dEndDate = oSelectedDates.getEndDate();
				var dEnd = moment.utc(dEndDate
					? Date.UTC(dEndDate.getFullYear(), dEndDate.getMonth(), dEndDate.getDate())
					: dBegin).add(1, 'd').add(-1, 'm').toDate();
				oDraftModel.setProperty("/end", dEnd);
			}
		},

		onImportCandlesDialogOk: function(oEvent) {
			var oDialog = oEvent.getSource().getParent();
			var oDraft = oDialog.getModel("draft").getData();
			oDialog.close();

			var oModel = this.getView().getModel("data");
			var sPath = this.getView().getElementBinding("data").getPath();
			// bindContext не поддерживает параметры через body
			$.ajax({
				contentType: 'application/json',
				data: JSON.stringify({
					begin: moment(oDraft.begin).toISOString(),
					end: moment(oDraft.end).toISOString()}),
				dataType: 'json',
				success: function() {
					oModel.refresh();
				},
				processData: false,
				type: 'POST',
				url: "/odata" + sPath + "/Crypto.update"
		});
		},

		onImportCandlesDialogCancel: function(oEvent) {
			oEvent.getSource().getParent().close();
		},


		onNavBack: function() {
			window.history.go(-1);
		}
	});
});
