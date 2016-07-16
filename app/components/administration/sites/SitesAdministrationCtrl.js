'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');

module.exports = function ($scope, dataSvc, ngDialog, $route, busySvc, updateSvc, NgTableParams) {
  busySvc.busy('sitesAdmin');
  $scope.deptTable = new NgTableParams({ sorting: { dept_name: 'asc' }, count: 10 }, { filterDelay: 0, defaultSort: 'asc', dataset: [] });
  $scope.deptCols = [
    { id: 'modify', width: '1%' },
    { title: 'Nom', id: 'dept_name', sortable: 'dept_name', filter: { dept_name: 'text' }, shrinkable: true, width: '100%' },
    { title: 'Sites', id: 'open', sortable: 'count', width: '1%', align: 'center' }
  ];

  $scope.siteTable = new NgTableParams({ sorting: { site_name: 'asc' }, count: 10 }, { filterDelay: 0, defaultSort: 'asc', dataset: [] });
  $scope.siteCols = [
    { id: 'modify', width: '1%' },
    { title: 'Aurore', field: 'site_pk', sortable: 'site_pk', filter: { site_pk: 'text' }, shrinkable: true, width: '10%' },
    { title: 'Nom', id: 'site_name', sortable: 'site_name', filter: { site_name: 'text' }, shrinkable: true, width: '90%' },
    { title: 'Agents', id: 'employees', sortable: 'count', width: '1%', align: 'right' }
  ];

  function reload() {
    Promise.all([dataSvc.getAllSites(), dataSvc.getAllDepartments()]).then(_.spread(function (sites, departments) {
      $scope.departments = departments;
      $scope.deptTable.settings({ dataset: _.values(departments) });
      $scope.siteTable.settings({
        dataset: _($scope.sites = _.map(sites, function (site) {
          return _.extend(site, { dept: departments[site.site_dept_fk] });
        })).thru(function (sites) {
          return $scope.selected ? _.filter(sites, { site_dept_fk: $scope.selected.dept_pk }) : sites;
        }).value()
      });
      busySvc.done('sitesAdmin');
    }), _.partial(busySvc.done, 'sitesAdmin'));
  }
  reload();

  $scope.open = function (dept) {
    if ($scope.selected && $scope.selected.dept_pk === dept.dept_pk) {
      delete($scope.selected);
    } else {
      $scope.selected = dept;
    }

    $scope.siteTable.settings({
      dataset: _($scope.sites).thru(function (sites) {
        return $scope.selected ? _.filter(sites, { site_dept_fk: $scope.selected.dept_pk }) : sites;
      }).value()
    });
  };

  function confirm(msg, callback, extension) {
    ngDialog.openConfirm({
      template: './components/dialogs/warning.html',
      scope: _.extend($scope.$new(), { innerHtml: msg }, extension)
    }).then(callback);
  }

  $scope.editSite = function (site) {
    ngDialog.open({
      template: './components/administration/sites/site_dialog.html',
      scope: _.extend($scope.$new(), {
        site: _.cloneDeep(site),
        callback: function (_site, close) {
          confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">' + (site ? 'modifier' : 'cr&eacute;er') +
            '</span> le site <span class="text-warning">' + _site.site_name +
            '</span>&nbsp;?<hr />Cette op&eacute;ration est irr&eacute;versible et prend effet imm&eacute;diatement.',
            function () {
              updateSvc.editSite(_site).then(function () {
                $scope.$emit('alert', {
                  type: 'success',
                  msg: 'Site <strong>' + _site.site_name + '</strong> ' + (site ? 'modifi&eacute;.' : 'cr&eacute;&eacute;.')
                });
                reload();
                close();
              }, function () {
                $scope.$emit('error');
                close();
              });
            }
          );
        },
        delete: function (close) {
          confirm(
            'Supprimer un site entra&icirc;ne la suppression des affectations de ses agents. Cette op&eacute;ration est irr&eacute;versible et prend effet imm&eacute;diatement.<hr />&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-danger">supprimer</span> le site <span class="text-danger">' +
            site.site_name + '</span>&nbsp;?',
            function () {
              updateSvc.deleteSite(site.site_pk).then(function () {
                $scope.$emit('alert', { type: 'success', msg: 'Site <strong>' + site.site_name + '</strong> supprim&eacute;.' });
                reload();
                close();
              }, function () {
                $scope.$emit('error');
                close();
              });
            }, { _type: 'danger' }
          );
        }
      })
    });
  };

  $scope.editDept = function (dept) {
    ngDialog.open({
      template: './components/administration/sites/dept_dialog.html',
      scope: _.extend($scope.$new(), {
        dept: _.cloneDeep(dept),
        callback: function (_dept, close) {
          confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">' + (dept ? 'modifier' : 'cr&eacute;er') +
            '</span> le d&eacute;partement <span class="text-warning">' + _dept.dept_name +
            '</span>&nbsp;?',
            function () {
              (dept ? updateSvc.editDept(_dept) : updateSvc.createDept(_dept)).then(function () {
                $scope.$emit('alert', {
                  type: 'success',
                  msg: 'D&eacute;partement <strong>' + _dept.dept_name + '</strong> ' + (dept ? 'modifi&eacute;.' : 'cr&eacute;&eacute;.')
                });
                reload();
                close();
              }, function () {
                $scope.$emit('error');
                close();
              });
            }
          );
        },
        delete: function (close) {
          confirm(
            'Supprimer un d&eacute;partement entra&icirc;ne la suppression de l\'ensemble de ses sites. Cette op&eacute;ration est irr&eacute;versible et prend effet imm&eacute;diatement.<hr />&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-danger">supprimer</span> le d&eacute;partement <span class="text-danger">' +
            dept.dept_name + '</span>&nbsp;?',
            function () {
              updateSvc.deleteDept(dept.dept_pk).then(function () {
                $scope.$emit('alert', { type: 'success', msg: 'D&eacute;partement <strong>' + dept.dept_name + '</strong> supprim&eacute;.' });
                reload();
                close();
              }, function () {
                $scope.$emit('error');
                close();
              });
            }, { _type: 'danger' }
          );
        }
      })
    });
  };
};
