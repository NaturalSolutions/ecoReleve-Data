
define(['jquery', 'marionette', 'backbone', 'config','sweetAlert', 'controller'],
  function($, Marionette, Backbone, config,Swal) {

  'use strict';
  return Marionette.AppRouter.extend({
    history: [],
    initialize: function(opt) {
      this.collection = new Backbone.Collection([
      {label: 'Manual import', href: 'importFile', icon: 'reneco-import'},
      {label: 'New', href: 'stations/new', icon: 'reneco-entrykey'},
      {label: 'Release', href: 'release', icon: 'reneco-to_release'},
      {label: 'Validate', href: 'validate', icon: 'reneco-validate'},
      {label: 'Stations', href: 'stations', icon: 'reneco-stations'},
      {label: 'Individuals', href: 'individuals', icon: 'reneco-individuals'},
      {label: 'Sensors', href: 'sensors', icon: 'reneco-sensors'},
      {label: 'Monitored Sites', href: 'monitoredSites', icon: 'reneco-sensors'},
      {label: 'Export', href: 'export', icon: 'reneco-export'},
      ]);
    },

    appRoutes: {
      'export(/)': 'export',

      'importFile(/)': 'importFile',

      'individuals/new(/)': 'newIndividual',
      'individuals/:id(/)': 'individuals',
      'individuals(/)': 'individuals',

      'stations/new/:from(/)': 'newStation',
      'stations/new(/)': 'newStation',
      'stations/:id(/)': 'stations',
      'stations(/)': 'stations',

      'sensors/new/:type(/)': 'newSensor',
      'sensors/:id(/)': 'sensors',
      'sensors(/)': 'sensors',

      'monitoredSites/new(/)': 'newMonitoredSite',
      'monitoredSites/:id(/)': 'monitoredSites',
      'monitoredSites(/)': 'monitoredSites',

      'validate/:type(/)': 'validateType',
      'validate(/)': 'validate',

      'release/:id(/)': 'release',
      'release(/)': 'release',

      '*route(/:page)': 'home',
    },

    execute: function(callback, args) {
      // get current route
      this.history.push(Backbone.history.fragment);
      var _this= this;

      if(window.app.checkFormSaved){
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
          //could be better
                if (!isConfirm) {
                    _this.previous();
                    return false;
                }else {
                  window.app.checkFormSaved = false;
                  _this.continueNav(callback, args);
                }
            });

      } else{
        this.continueNav(callback, args);
      }

    },

    onRoute: function(url, patern, params) {
      patern = patern.replace(/\(/g, '');
      patern = patern.replace(/\)/g, '');
      patern = patern.replace(/\:/g, '');
      patern = patern.split('/');

      if (patern[0] == '*route') {
        $('#arial').html('');
        $('#arialSub').html('');
      }else {
        var md = this.collection.findWhere({href: patern[0]});
        $('#arial').html('<a href="#' + md.get('href') + '">| &nbsp; ' + md.get('label') + '</a>');
        if (patern[1] && patern[1] != 'id' && patern[1] != 'type') {
          $('#arialSub').html('<a href="#' + patern[0] + '/' + patern[1] + '">| &nbsp;' + patern[1] + '</a>');
        }else {
          $('#arialSub').html('');
        }
      }
    },
    previous: function() {
        var url = '#'+ this.history[this.history.length-2];
        Backbone.history.navigate(url,{trigger:false, replace: false});
        this.history.pop();
    },
    continueNav : function(callback, args){
        $.ajax({
          context: this,
          url: config.coreUrl + 'security/has_access'
        }).done(function() {
          callback.apply(this, args);
        }).fail(function(msg) {
          if (msg.status === 502 || msg.status === 403) {
            document.location.href = config.portalUrl;
          }
        });
    }
  });
});
