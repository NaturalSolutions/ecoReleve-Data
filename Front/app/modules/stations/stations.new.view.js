define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',

  'moment',
  'dateTimePicker',
  'sweetAlert',

  'ns_form/NSFormsModuleGit',
  'ns_map/ns_map',

  'i18n'

], function(
  $, _, Backbone, Marionette,
  moment, datetime, Swal,
  NsForm, NsMap
){

  'use strict';

  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/stations.new.tpl.html',
    className: 'full-height white',

    events: {
      'click .js-btn-current-position': 'getCurrentPosition',
      'click .js-btn-save': 'save',

      'focusout input[name="Dat e_"]': 'checkDate',
      'change input[name="LAT"], input[name="LON"]': 'getLatLng',
      'change select[name="FK_Region"]': 'getRegion',
      'click .tab-link': 'displayTab',
      'change select[name="FieldWorker"]': 'checkUsers',
    },

    name: 'Station creation',

    ui: {
      'staForm': '.js-form',
    },

    initialize: function(options) {
      this.from = options.from;
      this.histoMonitoredSite = {};
    },

    onShow: function() {
      var _this = this;
      this.refrechView('#stWithCoords');
      this.map = new NsMap({
        popup: true,
        zoom: 2,
        element: 'map',
      });

      this.map.map.on('draw:created', function (e) {
				var type = e.layerType;
				_this.currentLayer = e.layer;
        var latlon = _this.currentLayer.getLatLng();

        _this.map.drawnItems.addLayer(_this.currentLayer);
        _this.$el.find('input[name="LAT"]').val(latlon.lat);
        _this.$el.find('input[name="LON"]').val(latlon.lng);
        _this.map.toggleDrawing();
      });
      
      
      this.map.map.on('draw:edited', function (e) {
        var latlon = _this.currentLayer.getLatLng();
        _this.$el.find('input[name="LAT"]').val(latlon.lat);
        _this.$el.find('input[name="LON"]').val(latlon.lng);
      });
      
      this.map.map.on('draw:deleted', function () {
        _this.removeLatLngMakrer(true);
			});
      this.$el.i18n();
    },

    getRegion: function(e){
      var val = $(e.currentTarget).val();
      var _this = this;
      $.ajax({
        url:'regions/administrative/'+val+'/geoJSON'
      }).done(function(geoJSON){
        if(_this.RegionLayer){
          _this.map.map.removeLayer(_this.RegionLayer);
        }
        
        var regionStyle = {
          "color": "#00cc00",
          "weight": 3,
          "opacity": 0.5
        };
        _this.RegionLayer = new L.GeoJSON(geoJSON, {style : regionStyle});
        _this.RegionLayer.addTo(_this.map.map);
        _this.map.map.fitBounds(_this.RegionLayer.getBounds());
      });
    },

    onDestroy: function() {
      this.map.destroy();
      this.nsForm.destroy();
    },

    getCurrentPosition: function() {
      var _this = this;
      if (navigator.geolocation) {
        var loc = navigator.geolocation.getCurrentPosition(function(position) {
          var lat = parseFloat((position.coords.latitude).toFixed(5));
          var lon = parseFloat((position.coords.longitude).toFixed(5));
          _this.updateMarkerPos(lat, lon);
          _this.$el.find('input[name="LAT"]').val(lat).change();
          _this.$el.find('input[name="LON"]').val(lon).change();
        });
      } else {
        Swal({
          title: 'The browser dont support geolocalization API',
          text: '',
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: 'rgb(147, 14, 14)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        });
      }
    },

    removeLatLngMakrer: function(reInitLatLng){
      this.map.drawnItems.removeLayer(this.currentLayer);
      this.currentLayer = null
      if(reInitLatLng){
        this.$el.find('input[name="LAT"]').val('');
        this.$el.find('input[name="LON"]').val('');
      }
      this.map.toggleDrawing();
    },

    getLatLng: function() {
      var lat = this.$el.find('input[name="LAT"]').val();
      var lon = this.$el.find('input[name="LON"]').val();
      this.updateMarkerPos(lat, lon);
    },

    updateMarkerPos: function(lat, lon) {
      if (lat && lon) {
        if(this.currentLayer){

          this.currentLayer.setLatLng(new L.LatLng(lat, lon));
        } else {
          this.currentLayer = new L.marker(new L.LatLng(lat, lon));
          this.map.drawnItems.addLayer(this.currentLayer)
        }
      } else {
        this.removeLatLngMakrer();
      }
    },

    checkUsers: function(e) {
      var usersFields = $('select[name="FieldWorker"]');
      var selectedUser = $(e.target).val();
      var exists = 0;
      $('select[name="FieldWorker"]').each(function() {
        var user = $(this).val();
        if (user == selectedUser) {
          exists += 1;
        }
      });
      if (exists > 1) {
        Swal({
          title: 'Fieldworker name error',
          text: 'Already selected ! ',
          type: 'error',
          showCancelButton: false,
          confirmButtonColor: 'rgb(147, 14, 14)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        },
        function(isConfirm) {
          $(e.target).val('');
        });
      }
    },

    displayTab: function(e) {
      var _this = this;
      e.preventDefault();
      window.checkExitForm(function(){
        _this.swithTab(e);
      });

     },
     swithTab : function(e){
       var ele = $(e.target);
       var tabLink = $(ele).attr('href');
       $('.tab-ele').removeClass('active');
       $(ele).parent().addClass('active');
       $(tabLink).addClass('active in');
       this.refrechView(tabLink);
     },

    refrechView: function(stationType) {
      var stTypeId;
      var _this = this;
      switch (stationType){
        case '#stWithCoords':
          stTypeId = 1;
          $('.js-get-current-position').removeClass('hidden');
          break;
        case '#stWithoutCoords':
          stTypeId = 3;
          $('.js-get-current-position').addClass('hidden');
          break;
        default:
          break;
      }

      if (this.nsForm) {
        this.nsForm.destroy();
      }

      this.ui.staForm.empty();

      this.nsForm = new NsForm({
        name: 'StaForm',
        modelurl: 'stations/',
        buttonRegion: [],
        formRegion: this.ui.staForm,
        displayMode: 'edit',
        objectType: stTypeId,
        id: 0,
        afterShow: function() {
          if(_this.from == 'release'){
            _this.$el.find('[name="fieldActivityId"]').val('1').change();
          }
          _this.$el.find('input[name="FK_MonitoredSite"]').on('change', function() {
              var msId = _this.$el.find('input[name="FK_MonitoredSite"]').attr('data_value');
              _this.getCoordFromMs(msId);
          });
        }
      });

      this.nsForm.savingSuccess =  function(model, resp) {
        _this.afterSave(model, resp);
      };

      this.nsForm.savingError = function (response) {
        var msg = 'An error occured, please contact an admninstrator';
        var type_ = 'error';
        var title = 'Error saving';
        if (response.status == 510) {
          msg = 'A station already exists with these parameters';
          type_ = 'warning';
          title = 'Error saving';
        }

        Swal({
          title: title,
          text: msg,
          type: type_,
          showCancelButton: false,
          confirmButtonColor: 'rgb(147, 14, 14)',
          confirmButtonText: 'OK',
          closeOnConfirm: true,
        });
      };
      this.rdy = this.nsForm.jqxhr;
    },

    getCoordFromMs: function(msId) {
      var _this = this;
      var url = 'monitoredSites/' + msId;

      $.ajax({
        context: this,
        url: url,
      }).done(function(data) {
        var lat = data['LAT'];
        var lon = data['LON'];
        _this.$el.find('input[name="LAT"]').val(lat).change();
        _this.$el.find('input[name="LON"]').val(lon).change();
      }).fail(function() {
        console.error('an error occured');
      });
    },

    afterSave: function(model, resp) {
      var id = model.get('ID');
      if(this.from == 'release'){
        Backbone.history.navigate('#release/' + id, {trigger: true});
        return;
      }else{
        Backbone.history.navigate('#stations/' + id, {trigger: true});
      }
    },

    save: function() {
           this.nsForm.butClickSave();
    }

  });
});
