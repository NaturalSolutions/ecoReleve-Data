define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'sweetAlert',
  'i18n',

], function($, _, Backbone, Marionette, swal
) {

  'use strict';

  return Marionette.LayoutView.extend({

    className: 'full-height',
    template: 'app/modules/importFile/rfid/templates/tpl-step2-rfid.html',

    name: 'step2 RFID',
    ui: {
      progress: '.progress',
      progressBar: '.progress-bar',
      fileHelper: '#help-file',
      fileGroup: '#group-file',
      modHelper: '#help-mod',
      modGroup: '#group-mod',
      modInput: '#input-mod'
    },
    events: {
      'change input[type="file"]': 'importFile',
      'click button#clear': 'clearFile',
      'drop .drag-zone-hover' : 'handleDrop',
      'dragover .drag-zone-hover' : 'handleDragOVer',
      'dragleave .drag-zone-hover' : 'handleDragLeave'
    },

    handleDrop : function(e) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      this.importFile(e.originalEvent.dataTransfer.files);
    },

    handleDragOVer : function(e) {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    },

    handleDragLeave : function(e) {
    },

    initialize: function(options) {
      this.sensorId = options.model.get('sensorId');
      this.row = options.model.get('row');
    },

    clearFile: function() {
      $('#input-file').val('');
    },

    validate: function(){

    },

    importFile: function(event) {
      var _this = this;
      this.clear();
      var module = this.ui.modInput.val();
      if (module !== '') {

        var reader = new FileReader();
        if (typeof event.target ==='undefined' ) {
          var file = event[0];
        }
        else {
          var file = $('#input-file').get(0).files[0] || null;
        }
        $('#clear').removeAttr('disabled');
        var ext = file.name.split('.');
        if (ext[ext.length - 1] != 'txt') {
          swal(
              {
                title: 'Wrong file type',
                text: 'The file should be a text file (.txt)',
                type: 'error',
                showCancelButton: false,
                confirmButtonColor: 'rgb(147, 14, 14)',
                confirmButtonText: 'OK',

                closeOnConfirm: true,
              }
            );
          return false;
        } else {
          var url = 'sensors/rfid/datas';
          var data = new FormData();
          var self = this;

        }

        reader.onprogress = function(data) {
          if (data.lengthComputable) {
            var progress = parseInt(data.loaded / data.total * 100).toString();
            self.ui.progressBar.width(progress + '%');
          }
        };

        reader.onload = function(e, fileName) {
          data.append('data', e.target.result);

          //data.append('module', self.model.get(self.parent.steps[self.parent.currentStep-1].name+'_RFID_identifer'));
          
          data.append('FK_Sensor',self.sensorId);
          data.append('StartDate', _this.row.StartDate);
          data.append('EndDate', _this.row.EndDate);


          $.ajax({
            type: 'POST',
            url: url,
            data: data,
            processData: false,
            contentType: false
          }).done(function(data) {
            $('.cancel').removeAttr('disabled');

            self.ui.progressBar.css({'background-color': 'green'})
            swal(
              {
                title: 'Succes',
                text: 'importing RFID file',
                type: 'success',
                showCancelButton: true,
                confirmButtonColor: 'green',
                confirmButtonText: 'Import new RFID',
                cancelButtonText: 'Go to Validate',
                closeOnConfirm: true,

              },
              function(isConfirm) {
                self.ui.progress.hide();
                if (isConfirm) {
                  Backbone.history.navigate('importFile',{trigger: true});
                } else {
                  Backbone.history.navigate('validate/rfid',{trigger: true});
                }
              }
            );

          }).fail(function(data) {
            $('#btnNext').attr('disabled');
            if (data.status == 520 || data.status == 510) {
              var type = 'warning';
              var title = 'Warning !'
              self.ui.progressBar.css({'background-color': 'rgb(218, 146, 15)'})
              var color = 'rgb(218, 146, 15)';
            } else {
              var type = 'error';
              var title = 'Error !'
              self.ui.progressBar.css({'background-color': 'rgb(147, 14, 14)'})
              var color = 'rgb(147, 14, 14)';
              _this.clearFile();

            }
            if (data.responseText.length > 250) {
              data.responseText = 'An error occured, please contact an admninstrator';
            }
            swal(
              {
                title: title,
                text: data.responseText,
                type: type,
                showCancelButton: false,
                confirmButtonColor: color,
                confirmButtonText: 'OK',
                closeOnConfirm: true,
              },
              function(isConfirm) {
              }
            );
          });
        };

        if (file) {
          this.clear();
          this.ui.progress.show();
          reader.readAsText(file);
        } else {
          this.ui.fileGroup.addClass('has-error');
          this.ui.fileHelper.text('Required');
        }
      } else {
        this.ui.modGroup.addClass('has-error');
        this.ui.modHelper.text('Required');
      }
    },

    clear: function() {
      this.ui.progressBar.width('0%');
      this.ui.progress.hide();
      this.ui.fileHelper.text('');
      this.ui.fileGroup.removeClass('has-error');
      this.ui.modHelper.text('');
      this.ui.modGroup.removeClass('has-error');
    },

  });
});
