'use strict';

var _ = require('underscore');
var moment = require('moment');

module.exports = function ($scope, $rootScope, updateSvc, dataSvc, ngDialog, busySvc) {
	$scope.headers = [];
	$scope.headers = JSON.parse('["H-Privé / Public","Matricule GA","Patronyme","Prénom","Date de naissance","H-Nature du contrat ZAP","H-Type de contrat ZAP (Lib)","code aurore","affectation","departement","Mail","H-Numéro SIRET","H-Etablissement (Code)","H-Etablissement (Lib)","H-Lieu de travail (Code)","H-Lieu de travail (Lib)","H-Service (Code)","H-Service (Lib)","Age situation N°1","H-Catégorie professionnel (Code)","H-Niveau","H-Fonction d\'appartenance (Lib)","H-Emploi générique","H-Emploi repère ANPE (Lib)","H-Filière (Lib)","H-Permanent/Temporaire/Surn (Lib)","H-Motif de suspension GA (Lib)","H-Date de début suspension GA","H-Date de fin suspension GA","H-Plein/Partiel (Lib)","H-Emploi repere (Lib)","Sexe (Lib)","H-Date entrée Groupe","H-Date ancienneté paie","H-Anc Paie","H-Effectifs historique","H-ETP payé","H-Activité principale (Code)","H-Activité principale (date)","H-Activité principale (libellé long)"]');
	$scope.data = [[]];
	$scope.data = JSON.parse('[["Privé","","ABA BOWE-BOUNIOL","MADELEINE","1960-08-22","CD","Cas général","14759","Plateforme Entreprises Noisy-le-Grand","DPR","m.aba-bowe-bouniol@pole-emploi.fr","13000548114516","75291","PFP PLATEFORME TELEPHONIQUE RE","75291","PLATEFORME TELEPHONIQUE 3949","7596080100","PFE IDF Est 1","55.02","EMP","","Allocataires / DE","Technicien Expérimenté","","","Permanent","","","","Temps Plein","T.EXP.ALLOCATAIRES","Féminin","2006-01-01","2002-11-01","12.83","1","1","F02","2014-01-01","Conventions conseils généraux"],["Privé"," 00034367","ABADA","HASSINA","1957-03-25","CDI","Cas général","2326","Paris 18ème Bd Ney","DT 75","hassina.abada@pole-emploi.fr","13000548121800","75298","APE PARIS 18EME","75298","APE PARIS 18EME","7575031302","Paris Ney 2","58.43","EMP","","Allocataires / DE","Technicien Qualifié","","","Permanent","","","","Temps Plein","TECHN.QUAL.ALLOCAT.","Féminin","2007-05-01","2007-05-01","8.33","1","1","C07","2012-09-01","Accompagnement renforcé PE2015"],["Privé"," 00034859","ABASSI","IBTISSEM","1970-05-08","CDI","Cas général","2603","Meaux","DT 77","ibtissem.abassi@pole-emploi.fr","13000548118590","75997","APE MEAUX","75997","MEAUX","7577010402","Meaux 2","45.31","EMP","","Allocataires / DE","Technicien Hautement Qualifié","","","Permanent","","","","Temps Plein","T.HT.QUAL.ALLOCAT.","Féminin","2007-05-01","2007-05-01","8.33","1","1","C01","2012-09-01","PF Actif / EID / R. Entreprise"],["Privé"," 00082349","ABBADIE","AMEL","1970-03-02","CDD","CUI DD","2326","Paris 18ème Bd Ney","DT 75","amel.abbadie@pole-emploi.fr","13000548121800","75298","APE PARIS 18EME","75298","APE PARIS 18EME","7575031300","Paris Ney","45.49","EMP","","Allocataires / DE","Agent Qualifié","","","","","","","Temps Partiel","AGT ADMINISTRATIF","Féminin","2014-11-01","2014-11-01","0.83","1","0.74","A00","2014-11-01","CUI - Contrats aidés"],["Privé"," 00024732","ABBAKAL","NAIMA","1967-12-03","CDI","Cas général","2643","Mantes-la-Jolie","DT 78","naima.abbakal@pole-emploi.fr","13000548123376","75820","APE MANTES LA JOLIE","75820","APE MANTES LA JOLIE","7578010102","Mantes 2","47.74","EMP","","Allocataires / DE","Technicien Hautement Qualifié","","","Permanent","","","","Temps Plein","T.HT.QUAL.ALLOCAT.","Féminin","2003-05-01","2001-08-01","14.08","1","1","C06","2012-09-01","PF Actif /EID/R.Entrep+G.Droit"],["Privé"," 00027493","ABBAS","Nacéra","1975-04-26","CDI","Cas général","6227","Cadres Guyancourt","DT 78","nacera.abbas@pole-emploi.fr","13000548120208","75637","APE GUYANCOURT","75640","CADRES GUYANCOURT","7578020501","Cadre Guyancourt 1","40.34","EMP","","Allocataires / DE","Technicien Hautement Qualifié","","","Permanent","","","","Temps Partiel","T.HT.QUAL.ALLOCAT.","Féminin","2003-05-01","2003-05-01","12.33","1","0.8","C01","2012-09-01","PF Actif / EID / R. Entreprise"],["Privé"," 00039304","ABBASSI","FATIHA","1979-07-14","CDI","Cas général","2525","Aulnay-sous-Bois","DT 93","fatiha.abbassi@pole-emploi.fr","13000548119309","75701","APE AULNAY SOUS BOIS","75701","AULNAY SOUS BOIS","7593010202","Aulnay sous Bois 2","36.12","EMP","","Allocataires / DE","Technicien Qualifié","","","Permanent","","","","Temps Partiel","TECHN.QUAL.ALLOCAT.","Féminin","2009-03-02","2009-03-02","6.49","1","0.5","C01","2012-09-01","PF Actif / EID / R. Entreprise"],["Privé"," 00024750","ABDEDOU","FATMA","1954-06-01","CDI","Cas général","2310","Paris 15ème Brançion","DT 75","fatima.abdedou@pole-emploi.fr","13000548122162","75192","APE PARIS 15 EME","75192","APE PARIS 15 EME","7575030305","Brancion 5","61.24","EMP","","Allocataires / DE","Technicien Expérimenté","","","Permanent","","","","Temps Plein","T.EXP.ALLOCATAIRES","Féminin","2001-12-01","2006-11-01","8.83","1","1","B03","2012-09-01","Liquidation + EID"],["Privé"," 00001704","ABDELLAOUI","OMAR","1978-09-09","CDI","Cas général","2391","Gonesse","DT 95","omar.abdellaoui@pole-emploi.fr","13000548116636","75691","APE GONESSE","75607","ALE GARGES GONESSE","7595020104","Gonesse 4","36.97","EMP","","Allocataires / DE","Technicien Hautement Qualifié","","","Permanent","","","","Temps Plein","T.HT.QUAL.ALLOCAT.","Masculin","2006-03-06","2006-03-06","9.48","1","1","B03","2015-07-01","Liquidation + EID"],["Privé"," 00036925","ABDELLI","LINE","1959-09-07","CDI","Cas général","3048","A2S Antony","DT 92","line.abdelli@pole-emploi.fr","13000548118657","75294","APE ANTONY","75294","PE ANTONY","7592020901","A2S Antony 1","55.98","EMP","","Allocataires / DE","Technicien Qualifié","","","Permanent","","","","Temps Plein","TECHN.QUAL.ALLOCAT.","Féminin","2008-04-01","2008-04-01","7.41","1","1","F01","2012-09-01","CSP"],["Privé"," 00076765","ABDI","GAELLE","1986-05-22","CDI","Cas général","2390","Persan","DT 95","gaelle.abdi@pole-emploi.fr","13000548101935","75689","APE PERSAN","75589","ALE Persan","7595010501","Persan 1","29.27","EMP","","Allocataires / DE","Agent Hautement Qualifié","","","Temporaire","","","","Temps Plein","AGT H.Q.ALLOCATAIRES","Féminin","2014-02-04","2014-02-04","1.57","1","1","B04","2015-07-01","Liquidation + PF actif + EID"],["Privé"," 00052364","ABDILLAH","FARHATY","1984-06-20","CDI","Cas général","2274","SIEGE DR (PLUTON)","DR","farhaty.abdillah@pole-emploi.fr","13000548118277","75725","DR ILE DE France","75728","DR ILE DE FRANCE","7599420000","DRSE Stats Etud. Eval.","31.19","EMP","","Information Communication","Technicien Hautement Qualifié","","","Permanent","","","","Temps Plein","AGT ADMINISTRATIF","Féminin","2010-08-11","2010-08-11","5.05","1","1","S16","2013-06-01","Statistiques Etudes évaluation"],["Public"," 00034800","ABDOU","ISMAËL","1981-05-16","CDI","Cas général","2563","Point relais Alfortville","DT 94","ismael.abdou@pole-emploi.fr","13000548102701","75980","APE POINT RELAIS ALFORTVILLE","75780","ALE Alfortville","7594010703","Alfortville 3","34.29","EMP","2","ANPE","ANPE","Conseiller","CONSEIL A L\'EMPLOI","Permanent","","","","Temps Partiel","","Masculin","2007-05-09","2007-05-09","8.3","1","0.86","C07","2013-11-01","Accompagnement renforcé PE2015"],["Privé"," 00070594","ABDOUCH","NAWAL","1975-06-12","CDI","Cas général","2304","Paris 19ème Armand Carrel","DT 75","nawal.abdouch@pole-emploi.fr","13000548121826","75297","APE PARIS 19EME OUEST","75297","APE PARIS 19EME OUEST","7575031002","Armand Carrel 2","40.21","EMP","","Allocataires / DE","Agent Hautement Qualifié","","","Temporaire","","","","Temps Plein","AGT H.Q.ALLOCATAIRES","Féminin","2013-05-14","2013-05-14","2.29","1","1","C01","2013-05-14","PF Actif / EID / R. Entreprise"],["Privé"," 00071885","ABDOUL","KARYME","1974-03-10","CDI","Cas général","2406","Corbeil-Essonnes","DT 91","karyme.abdoul@pole-emploi.fr","13000548116008","75462","APE CORBEIL BOURGOIN","75362","ALE Corbeil","7591010302","Corbeil 2","41.47","EMP","","Allocataires / DE","Agent Hautement Qualifié","","","Temporaire","","","","Temps Plein","AGT H.Q.ALLOCATAIRES","Masculin","2013-07-01","2013-07-01","2.16","1","1","B01","2014-01-01","Liquidation / précontentieux"],["Privé"," 00067366","ABDOUL","ANGELIQUE","1982-05-02","CDI","Cas général","2605","Dammarie-les-Lys","DT 77","angelique.abdoul@pole-emploi.fr","13000548100804","75446","APE DAMMARIE LES LYS","75346","ALE Melun","7577030205","Dammarie 5","33.32","EMP","","Allocataires / DE","Agent Hautement Qualifié","","","Temporaire","","","","Temps Plein","AGT H.Q.ALLOCATAIRES","Féminin","2012-11-05","2013-04-10","2.38","1","1","C01","2013-11-01","PF Actif / EID / R. Entreprise"],["Privé"," 00069257","ABDUL","BADURUNNISSA","1990-01-17","CDI","Cas général","2645","Saint-Germain-en-Laye","DT 78","badurunnissa.abdul@pole-emploi.fr","13000548121248","75519","APE CADRES SAINT GERMAIN EN LA","75519","APE SAINT GERMAIN EN LAYE","7578010703","St Germain en L. 3","25.62","EMP","","Allocataires / DE","Agent Hautement Qualifié","","","Temporaire","","","","Temps Plein","AGT H.Q.ALLOCATAIRES","Féminin","2013-03-04","2013-03-04","2.48","1","1","B03","2015-07-01","Liquidation + EID"],["Privé"," 06100699","ABELA","MELVINA","1961-04-10","CDI","Cas général","2309","Contentieux","DPR","melvina.abela@pole-emploi.fr","13000548118277","75725","DR ILE DE France","75728","DR ILE DE FRANCE","7596010100","PF Contentieux 1","54.38","CAD","","Gestion-Audit-Organisation","Professionnel Hautement Qualif","","","Permanent","","","","Temps Plein","AUDITEUR","Féminin","2002-02-18","2002-02-18","13.53","1","1","D03","2014-01-01","Contentieux (E et DE)"],["Privé"," 00058241","ABELLI","NATHALIE","1986-06-17","CDI","Cas général","2479","Plateforme Téléphonique Régionale","DPR","nathalie.abelli@pole-emploi.fr","13000548114516","75291","PFP PLATEFORME TELEPHONIQUE RE","75291","PLATEFORME TELEPHONIQUE 3949","7596071000","PF IDF Telephon10","29.2","EMP","","Allocataires / DE","Agent Hautement Qualifié","","","","","","","Temps Plein","AGT H.Q.ALLOCATAIRES","Féminin","2011-09-06","2011-10-06","3.9","1","1","A01","2012-09-01","Accueil DE Phys/Tél/RAC (3949)"],["Privé"," 00029908","ABERCHAM","FATY","1981-02-04","CDI","Cas général","2298","Cadres Paris Magenta","DT 75","faty.abercham@pole-emploi.fr","13000548110738","75243","APES CADRES PARIS MAGENTA","75144","USP Cadres Paris Magenta","7575021702","Paris 100 % Web 2","34.57","EMP","","Allocataires / DE","Technicien Hautement Qualifié","","","Permanent","","","","Temps Plein","T.HT.QUAL.ALLOCAT.","Féminin","2008-04-01","2005-11-14","9.79","1","1","C01","2012-09-01","PF Actif / EID / R. Entreprise"]]');
	$scope.employees = [];

	busySvc.busy();
	dataSvc.getAllSites().then(function (sites) {
		$scope.sites = sites;
		busySvc.done();
	});

	$scope.steps = [
		{
			step: 1,
			title: 'Chargement des donn&eacute;es',
			template: 'components/administration/update/step1.html'
		},{
			step: 2,
			title: 'Analyse du fichier',
			template: 'components/administration/update/step2.html'
		},{
			step: 3,
			title: 'Import de la mise-&agrave;-jour',
			template: 'components/administration/update/step3.html'
		}
	];
	$scope.currentStep = $scope.steps[0];

	$scope.step1 = {
		file: undefined,
		pageNumber: undefined,
		pageName: undefined,
		upload: function () {
			busySvc.busy();
			updateSvc.getMatrix($scope.step1.file, $scope.step1.pageNumber - 1, $scope.step1.pageName)
				.then(function (data) {
					$scope.headers = data[0];
					$scope.data = data.slice(1);
					$scope.currentStep = $scope.steps[1];
					busySvc.done();
				}, function () {
					busySvc.done();
					$rootScope.alerts.push({type: 'danger', msg: '<strong>Erreur&nbsp;:</strong> Le fichier selectionn&eacute; n\'a pas pu &ecirc;tre lu.<hr />Assurez-vous de disposer d\'un document au format <strong>.xls</strong> ou <strong>.xlsx</strong> et que le nom (ou le num&eacute;ro) de la page &agrave; charger est correctement reseign&eacute;.'});
				}
			);
		}
	};

	$scope.step2 = {
		current: 0,
		prev: function () {
			$scope.step2.current = Math.max(0, $scope.step2.current - 1);
			_.each($scope.step2.template, function (field, name) {
				field.feedback = $scope.step2.feedback(field, name);
			});
		},
		next: function () {
			$scope.step2.current = Math.min($scope.data.length - 1, $scope.step2.current + 1);
			_.each($scope.step2.template, function (field, name) {
				field.feedback = $scope.step2.feedback(field, name);
			});
		},
		validate: function () {
			busySvc.busy();
			setTimeout(function () {
				$scope.employees = _.map($scope.data, function (entry, idx) {
					var res = _.object(_.map($scope.step2.template, function (field, name) {
						return [name, entry[field.source] ? entry[field.source].trim() : ''];
					}));

					res.line = idx;
					_.each($scope.step2.template, function (field, name) {
						if(!$scope.step3.validate(name, entry[field.source] ? entry[field.source].trim() : '')) {
							if(res.error) {
								res.error.push(name);
							} else {
								res.error = [name];
							}
							
							return false;
						}

						return true;
					});
					res.valid = !res.error;

					return res;
				});

				$scope.invalidEmployees = _.where($scope.employees, {valid: false});
				busySvc.done();
				$scope.currentStep = $scope.steps[2];
				$scope.$apply();
			}, 100);
		},
		feedback: function (field, name) {
			if(field.source !== undefined) {
				return $scope.step3.validate(name, $scope.data[$scope.step2.current][field.source]);
			}

			return;
		},
		template: {
			'empl_pk': {
				display: 'Matricule',
				rule: 'Doit être renseigné'
			},
			'empl_firstname': {
				display: 'Prénom',
				rule: 'Doit être renseigné'
			},
			'empl_surname': {
				display: 'Nom de famille',
				rule: 'Doit être renseigné'
			},
			'empl_addr': {
				display: 'Adresse e-mail',
				rule: 'Facultative'
			},
			'empl_permanent': {
				display: 'Type de contrat',
				rule: 'Doit être soit \'CDI\' soit \'CDD\''
			},
			'empl_dob': {
				display: 'Date de naissance',
				rule: 'Doit être au format YYYY-MM-DD'
			},
			'siem_site_fk': {
				display: 'Code Aurore d\'affectation',
				rule: 'Doit correspondre à un code Aurore existant'
			}
		}
	};

	$scope.step3 = {
		update: function () {
			busySvc.busy();
			updateSvc.update($scope.employees).then(function () {
				$rootScope.alerts.push({type: 'success', msg: 'Mise-&agrave;-jour effectu&eacute;e avec succ&egrave;s.'});
				busySvc.done();
				window.history.back();
			});
		},
		validate: function (name, value) {
			if(value === undefined) {
				return false;
			}

			switch (name) {
				case 'empl_addr':
					return true;
				case 'empl_dob':
					return moment(value, 'YYYY-MM-DD', true).isValid();
				case 'empl_permanent':
					return value.toUpperCase() === 'CDI' || value.toUpperCase() === 'CDD';
				case 'siem_site_fk':
					return $scope.sites[value] !== undefined;
				default:
					return value !== undefined && value !== '';
			}
		},
		open: function (empl) {
			var dialogScope = $scope.$new(true);
			dialogScope.empl = empl;
			dialogScope.sites = $scope.sites;
			dialogScope.template = $scope.step2.template;

			ngDialog.open({
				templateUrl: 'components/dialogs/imported_employee.html',
				scope: dialogScope
			});
		}
	};
};
