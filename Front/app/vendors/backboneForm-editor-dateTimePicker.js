define([
  'jquery',
  'backbone',
  'backbone_forms',

], function(
  $, Backbone, Form
){
  'use strict';
  return Form.editors.DateTimePicker = Form.editors.Base.extend({


    previousValue: '',

    events: {
      'hide': "hasChanged"
    },

    hasChanged: function(currentValue) {
      if (currentValue !== this.previousValue){
        this.previousValue = currentValue;
        this.trigger('change', this);
      }
    },

    initialize: function(options) {
      Form.editors.Base.prototype.initialize.call(this, options);
      this.template = options.template || this.constructor.template;
      this.options = options;
    },

    getValue: function() {
      var date= new Date;
      return this.el.children['Date_'].value
    },

    render: function() {
      var options = this.options;
      var schema = this.schema;

      if (options.schema.validators) {
        var required = options.schema.validators[0];
      }

      var obj;
      var value;
      if (options.model) {
        value = options.model.get(this.options.key);
      } else {
        value = '';
      }

      if (options) {
        obj = {
          value : value,
          editorClass : schema.editorClass,
          required: required,
          editable : (options.schema.editable != false) ? '' : 'disabled',
          hidden : (options.schema.editable != false) ? '' : 'hidden',
        }
      } else {
        
      }



      var $el = $($.trim(this.template(obj)));
      this.setElement($el);

      $($el[0]).datetimepicker();

      //tmp solution ? datetimepicker remove the value
      /*
      if (this.options) {
        var value = this.options.model.get(this.options.key);
        $el.find('input').val(value);
      }*/

      return this;
    },
    }, {
    // STATICS
      template: _.template('<div class="input-group date" id="dateTimePicker" data-editors="Date_"><span class="input-group-addon <%= hidden %>"><span class="glyphicon-calendar glyphicon"></span></span><input id="c24_Date_" name="Date_" class="<%= editorClass %> <%= required %>" type="text" placeholder="jj/mm/aaaa hh:mm:ss" data-date-format="DD/MM/YYYY HH:mm:ss" value="<%= value %>" <%= editable %> ></div>', null, Form.templateSettings)
  });
});
