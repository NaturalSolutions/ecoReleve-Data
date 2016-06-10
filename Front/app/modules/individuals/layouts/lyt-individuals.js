
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'translater',
  'config',
  'ns_modules/ns_com',
  'ns_grid/model-grid',
  //'ns_filter/model-filter_module',
  'ns_filter_bower',
  './lyt-individuals-detail',
  './lyt-individuals-new',
  'i18n'

], function($, _, Backbone, Marionette, Swal, Translater, config,
  Com, NsGrid, NsFilter, LytIndivDetail, LytNewIndiv
) {

  'use strict';

  return Marionette.LayoutView.extend({

    template: 'app/modules/individuals/templates/tpl-individuals.html',
    className: 'full-height animated white rel',

    events: {
      'click #btnFilter': 'filter',
      'click #back': 'hideDetails',
      'click button#clear': 'clearFilter',
      'click button#createNew': 'newIndividual',
      'click #btn-export': 'exportGrid'
    },

    ui: {
      'grid': '#grid',
      'paginator': '#paginator',
      'filter': '#filter',
      'detail': '#detail',
      'btnNew': '#createNew'
    },

    regions: {
      detail: '#detail',
    },

    rootUrl: '#individuals/',

    initialize: function(options) {
      if (options.id) {
        this.indivId = options.id;
      }
      this.com = new Com();
      this.translater = Translater.getTranslater();
    },

    onRender: function() {
      this.$el.i18n();
    },

    onShow: function() {
      this.displayFilter();
      this.displayGrid();
      if (this.indivId) {
        this.detail.show(new LytIndivDetail({indivId: this.indivId}));
        this.ui.detail.removeClass('hidden');
      }
    },

    displayGrid: function() {
      var _this = this;
      this.grid = new NsGrid({
        pageSize: 20,
        pagingServerSide: true,
        com: this.com,
        url: config.coreUrl + 'individuals/',
        urlParams: this.urlParams,
        rowClicked: true,
        totalElement: 'totalEntries',
      });

      this.grid.rowClicked = function(args) {
        _this.rowClicked(args.row);
      };
      this.grid.rowDbClicked = function(args) {
        _this.rowDbClicked(args.row);
      };
      this.ui.grid.html(this.grid.displayGrid());
      this.ui.paginator.html(this.grid.displayPaginator());
    },

    rowClicked: function(row) {
      this.detail.show(new LytIndivDetail({
        model: row.model,
        globalGrid: this.grid
      }));
      var id = row.model.get('ID');
      Backbone.history.navigate(this.rootUrl + id, {trigger: false});
      this.grid.currentRow = row;
      this.grid.upRowStyle();
      this.ui.detail.removeClass('hidden');
    },

    rowDbClicked: function(row) {
    },

    displayFilter: function() {
      this.filters = new NsFilter({
        url: config.coreUrl + 'individuals/',
        com: this.com,
        filterContainer: this.ui.filter,
      });
    },

    filter: function() {
      this.filters.update();
    },
    clearFilter: function() {
      this.filters.reset();
    },
    hideDetails: function() {
    var _this= this;
    if(window.app.checkFormSaved && window.app.formEdition){
         Swal({
            title: 'Saving form',
            text: 'Current form is not yet saved. Would you like to continue without saving it?',
            type: 'error',
            showCancelButton: true,
            confirmButtonColor: 'rgb(221, 107, 85)',
            confirmButtonText: 'OK',
            cancelButtonColor: 'grey',
            cancelButtonText: 'Cancel',
            closeOnConfirm: true,
        },
        function(isConfirm) {
           if (!isConfirm) {
              return false;
            }else {
                window.app.checkFormSaved = false;
                Backbone.history.navigate(_this.rootUrl, {trigger: false});
                _this.ui.detail.addClass('hidden');
            }
        });
      } else{
          Backbone.history.navigate(this.rootUrl, {trigger: false});
          this.ui.detail.addClass('hidden');
      }
    },
    newIndividual: function() {
      Backbone.history.navigate(this.rootUrl + 'new/', {trigger: true});
      /*
      // TODO  implementation of group creation front/end
      this.ui.btnNew.tooltipList({
        availableOptions: [{
          label: 'Individual',
          val: 'individual'
        }
        ],
        liClickEvent: function(liClickValue) {
          Backbone.history.navigate(this.rootUrl + 'new/' + liClickValue, {trigger: true});
        },
        position: 'top'
      });*/
    },

    exportGrid: function() {
      var url = config.coreUrl + 'individuals/export?criteria='+JSON.stringify(this.grid.collection.searchCriteria);
      var link = document.createElement('a');
      link.classList.add('DowloadLinka');
      
      //link.download = url;
      link.href = url;
      link.onclick = function () {
          //this.parentElement.removeChild(this);
          var href = $(link).attr('href');
          window.location.href = link;
          document.body.removeChild(link);
      };
     /*his.$el.append(link);*/
     document.body.appendChild(link);
     link.click();
    }
  });
});
