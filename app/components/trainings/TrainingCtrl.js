'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');
var moment = require('moment');
var pdfMake = require('pdfmake');

module.exports = function ($scope, $rootScope, $routeParams, dataSvc, trngSvc, $location, ngDialog, busySvc) {
	busySvc.busy();

	Promise.all([dataSvc.getTraining($routeParams.trng_pk), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(function(results) {
		$scope.trng = results[0];
		$scope.trng.type = results[1][results[0].trng_trty_fk];
		$scope.trainees = _.values(results[0].trainees);
		$scope.certificates = _.values(results[2]);
		$scope.trng.expirationDate = moment($scope.trng.trng_date).add($scope.trng.type.trty_validity, 'months').format('YYYY-MM-DD');
		$scope.trng.validity = moment.duration($scope.trng.type.trty_validity, 'months').asYears();
		busySvc.done();
		$scope.$apply();
	});

	$scope.generateSignInSheet = function () {
		pdfMake.createPdf({
			pageMargins: [40, 80, 40, 60],
			header: {
				text: [
					$scope.trng.type.trty_name + ' - ' + moment($scope.trng.trng_date).format('dddd Do MMMM YYYY'),
					{text: '\nFiche d\'émargement', style: 'em'}
				],
				alignment: 'center',
				margin: [20, 20, 20, 10]
			},
			footer: function (currentPage, pageCount) {
				return {
					columns: [
						{
							width: '*',
							text: [
								'Fiche formation : ',
								{text: $location.absUrl(), link: $location.absUrl(), decoration: 'underline', style: 'em'}
							]
						}, {
							width: 'auto',
							text: [
								'page ',
								{text: currentPage.toString(), style: 'em'},
								' sur ',
								{text: pageCount.toString(), style: 'em'}
							],
							alignment: 'right'
						}
					],
					margin: [20, 20, 20, 0]
				};
			},
		  content: [
		  	{
		  		text: $scope.trng.type.trty_name + ' - ' + moment($scope.trng.trng_date).format('dddd Do MMMM YYYY') + '\n\n\n',
		  		style: 'title',
		  		alignment: 'center'
		  	}, {
					style: 'tableExample',
					table: {
						headerRows: 1,
						widths: ['auto', 'auto', 'auto', '*'],
						body: [
							[
								{ text: 'Matricule', style: 'table-header'},
								{ text: 'Nom', style: 'table-header'},
								{ text: 'Prénom', style: 'table-header'},
								{ text: 'Émargement', style: 'table-header', alignment: 'center'}
							]
						].concat(_.map(_.sortBy($scope.trainees, 'empl_surname'), function (empl) {
							return [empl.empl_pk, {text: empl.empl_surname, style: 'em'}, {text: empl.empl_firstname, style: 'em'}, ''];
						}))
					},
					layout: {
						hLineWidth: function (i, node) {
							if (i === 0 || i === node.table.body.length) {
								return 0;
							}

							return (i === 1) ? 2 : 1;
						},
						vLineWidth: function () {
							return 0;
						},
						hLineColor: function (i) {
							return (i === 1) ? 'black' : 'grey';
						},
						vLineColor: function () {
							return 'grey';
						},
						paddingTop: function (i) {
							return i === 0 ? 4 : 20;
						},
						paddingBottom: function (i) {
							return i === 0 ? 4 : 20;
						},
						paddingLeft: function (i) { return i === 0 ? 0 : 6; },
						paddingRight: function (i, node) { return i === node.table.widths.length - 1 ? 0 : 6; }
					}
				}
		  ],
		  styles: {
		  	'em': {
		  		color: 'black'
		  	},
		  	'title': {
					fontSize: 18
		  	},
		  	'table-header': {
					bold: true,
					fontSize: 13
		  	}
		  },
		  defaultStyle: {
				color: 'grey'
		  }
		}).open();
	};

	$scope.selectEmployee = function (empl_pk) {
		$location.path('/employees/' + empl_pk);
	};

	$scope.edit = function () {
		$location.path('/trainings/' + $scope.trng.trng_pk + '/edit');
	};

	$scope.complete = function () {
		$location.path('/trainings/' + $scope.trng.trng_pk + '/complete');
	};

	$scope.delete = function () {
		var dialogScope = $scope.$new(true);
		dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">supprimer d&eacute;finitivement</span> cette formation&nbsp? Cette op&eacute;ration est irr&eacute;versible et prend effet imm&eacute;diatement.';
		ngDialog.openConfirm({
			template: 'components/dialogs/warning.html',
			scope: dialogScope
		}).then(function () {
			trngSvc.deleteTraining($scope.trng.trng_pk).then(function () {
				$rootScope.alerts.push({type: 'success', msg: 'Formation effac&eacute;e.'});
				$location.path('/trainings');
			});
		});
	};
};
