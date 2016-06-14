define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone-forms',

  ], function ($, _, Backbone, Marionette, Form, List, tpl) {

    'use strict';
    return Form.editors.GridFormEditor = Form.editors.Base.extend({
        events: {
            'click #addFormBtn' : 'addEmptyForm',
			'click .cloneLast' : 'cloneLast',
        },
        initialize: function(options) {
			
            if (options.schema.validators.length) {
                this.defaultRequired = true;
            } else {
                options.schema.validators.push('required');
                this.defaultRequired = false;
            }

            Form.editors.Base.prototype.initialize.call(this, options);

            this.template = options.template || this.constructor.template;
            this.options = options;
            this.options.schema.fieldClass = 'col-xs-12';
			this.showLines = true ;
			if (this.options.showLines != null) {
				this.showLines = this.options.showLines ;
			}
            this.forms = [];
            this.disabled = options.schema.editorAttrs.disabled;

            this.hidden = '';
            if(this.disabled) {
                this.hidden = 'hidden';
            }
            this.hasNestedForm = true;

            this.key = this.options.key;
            this.nbByDefault = this.options.model.schema[this.key]['nbByDefault'];

        },
        //removeForm
        deleteForm: function() {

        },

        addEmptyForm: function() {
            var mymodel = Backbone.Model.extend({
                defaults : this.options.schema.subschema.defaultValues
            });

            var model = new mymodel();
            //model.default = this.options.model.attributes[this.key];
            model.schema = this.options.schema.subschema;
            model.fieldsets = this.options.schema.fieldsets;
            this.addForm(model,this.forms.length+1);
        },
		cloneLast: function() {
			console.log('LAST FORM MODEL BEFORE',this.forms[this.forms.length-1]) ;
			var resultat = this.forms[this.forms.length-1].commit() ;
			if (resultat != null) return ; // COmmit NOK, on crée pas la ligne
			console.log('LAST FORM MODEL',resultat,this.forms[this.forms.length-1]) ;
			
            var mymodel = Backbone.Model.extend({
                defaults : this.forms[this.forms.length-1].model.attributes
            });

            var model = new mymodel();
            //model.default = this.options.model.attributes[this.key];
            model.schema = this.options.schema.subschema;
            model.fieldsets = this.options.schema.fieldsets;
            this.addForm(model,this.forms.length+1);
        },
		

        addForm: function(model,index){
            var _this = this;
            var form = new Backbone.Form({
                model: model,
                fieldsets: model.fieldsets,
                schema: model.schema
            }).render();

            this.forms.push(form);

            if(!this.defaultRequired){
                form.$el.find('fieldset').append('\
                    <div class="' + this.hidden + ' col-xs-12 control">\
                        <button type="button" class="btn btn-warning pull-right" id="remove">-</button>\
                    </div>\
                ');
/*                form.$el.find('fieldset').prepend('\
                    <div class="' + this.hidden + ' col-xs-12 control">\
                        <button type="button" class="btn btn-warning pull-right" id="remove">-</button>\
                    </div>\
                ');*/
                form.$el.find('button#remove').on('click', function() {
                  _this.$el.find('#formContainer').find(form.el).remove();
                  var i = _this.forms.indexOf(form);
                  if (i > -1) {
                      _this.forms.splice(i, 1);
                  }
                  return;
                });
            }


            this.$el.find('#formContainer').append(form.el);
			if (_this.showLines) {
				this.$el.find('#formContainer form fieldset').last().prepend('<span class="grid-field col-md-2">' + index + '</span>');
			}
        },

        render: function() {
            //Backbone.View.prototype.initialize.call(this, options);
            var _this = this;

            var $el = $($.trim(this.template({
                hidden: this.hidden
            })));
            this.setElement($el);
            

            var data = this.options.model.attributes[this.key];

            var model = new Backbone.Model();
            model.schema = this.options.schema.subschema;

            var size=0;

            var odrFields = this.options.schema.fieldsets[0].fields;
			
            for (var i = odrFields.length - 1; i >= 0; i--) {
                var col = model.schema[odrFields[i]];
                //sucks
                var test = true;
                if(col.fieldClass){
                 test = !(col.fieldClass.split(' ')[0] == 'hide'); //FK_protocolType
                 col.fieldClass += ' grid-field';
                }

                if(col.title && test) {
                 this.$el.find('#th').prepend('<div class="'+ col.fieldClass +'"> | ' + col.title + '</div>');
                }


                if ( col.size == null) {
                    size += 150;
                }
                else {
                    size += col.size*25;
                }

            }
			if (_this.showLines) {
				this.$el.find('#th').prepend('<div class="grid-field col-md-2"> | line</div>') ;
				size += 310;
			}
			else {
				size += 285;
			}

            //this.$el.find('#th').prepend('<div style="width: 34px;" class="pull-left" ><span class="reneco reneco-trash"></span></div>');
            // size += 35;


            this.$el.find('#th').width(size);
            this.$el.find('#formContainer').width(size);

            if (data) {
                //data
                if (data.length) {
                    for (var i = 0; i < data.length; i++) {
                        if(i >= this.nbByDefault) {
                            this.defaultRequired = false;
                        }
                        var model = new Backbone.Model();
                        model.schema = this.options.schema.subschema;
                        model.fieldsets = this.options.schema.fieldsets;
                        model.attributes = data[i];
                        this.addForm(model,i+1);

                    };

                    if (data.length < this.nbByDefault) {
                        for (var i = 0; i < data.length; i++) {
                            this.addForm(model,i+1);
                        }
                    }
                    this.defaultRequired = false;
                }
            } else {
                //no data
                if (this.nbByDefault >= 1) {
                    for (var i = 0; i < this.nbByDefault; i++) {
                        this.addEmptyForm();
                    }
                    this.defaultRequired = false;
                }
            }

            return this;
        },

        feedRequiredEmptyForms: function() {

        },

        getValue: function() {
            var errors = false;
            for (var i = 0; i < this.forms.length; i++) {
                if (this.forms[i].commit()) {
                    errors = true;
                }
            };
            if (errors) {
                return false;
            } else {
                var values = [];
                for (var i = 0; i < this.forms.length; i++) {
                    var tmp = this.forms[i].getValue();
                    var empty = true;
                    for (var key in tmp) {
                        if(tmp[key]){
                            empty = false;
                        }
                    }
                    if(!empty){
                       /* if (this.defaultValue) {
                            tmp['FK_ProtocoleType'] = this.defaultValue;
                        }*/
                        values[i] = tmp;
                    }
                };
                return values;
            }


        },
        }, {
              //STATICS
              template: _.template('\
                <div>\
                    <button type="button" id="addFormBtn" class="cloneLast <%= hidden %> btn">+</button>\
					<button type="button"  class="cloneLast <%= hidden %> btn">Clone Last</button>\
                    <div class="required grid-form clearfix">\
                        <div class="clear"></div>\
                        <div id="th" class="clearfix"></div>\
                        <div id="formContainer" class="clearfix expand-grid"></div>\
                    </div>\
                    <button type="button" id="addFormBtn" class="<%= hidden %> btn">+</button>\
					<button type="button"  class="cloneLast <%= hidden %> btn">Clone Last</button>\
                </div>\
                ', null, Form.templateSettings),
          });
});