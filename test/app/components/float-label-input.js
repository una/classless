import Ember from 'ember';
import ValidationForm from '../components/form-with-validation';
import App from '../app';
import {RADIX} from '../constants';
import _ from 'lodash/lodash';

/**
 * PROPTYPES
 * error - {string} - error string
 * value - {string} - input value prop
 * pattern - {string} - regex string for validation
 * placeholder - {string} - input placeholder
 * required - {bool} - if is required input
 * inputClasses - {string} - string of classes to add to element
 * validateInput - {function} - custom input validation function
 * setErrorMessage - {function} - function to generate error message
 */

export default Ember.Component.extend({
  tagName: 'div',
  classNames: 'FloatLabel',
  inputTag: 'input',
  classNameBindings: [
    'required:is-required',
    'no-label:no-label',
    'no-checkmark:no-checkmark',
    'postfixTooltip:FloatLabel-withPostfixTooltip',
    'className'
  ],
  shouldValidate: false,

  onSetup: function () {
    let parentView = this.get('parentView');
    while(parentView && !(parentView instanceof ValidationForm)) {
      parentView = parentView.get('parentView');
    }
    this.validationForm = parentView;
  }.on('willInsertElement'),

  validateForm: function () {
    if(this.validationForm) {
      Ember.run.next(() => {
        this.validationForm.send('validateForm');
      });
    }
  },

  tooltipTitle: function() {
    if(!this.get('isValid')) {
      return this.get('invalidTooltip') || '';
    }
    return '';
  }.property('isValid'),

  dispatchInput: function () {
    let val = this.$(this.get('inputTag')).val();
    if (this.get('onInput')) {
      this.sendAction('onInput', val, this.get('isValid'), this.get('actionParams'));
    }
    return val;
  },

  setFocus: function () {
    if(this.get('selected')){
      this.$(this.get('inputTag')).focus();
    }
  }.observes('selected'),

  passesCustomValidity: function ($input) {
    if(this.validationForm) {
      return this.validationForm.passesCustomValidity($input);
    }
    return true;
  },

  passesInputCustomValidity: function($input) {
    let customValidation = this.get('customValidation');
    if(customValidation) {
      return customValidation($input.val());
    }
    return true;
  },

  validateInput: function(isRequiredCheck, isValChange) {
    let $this = this.$();
    let $input = $this.find(this.get('inputTag'));
    let isValid = $input[0] && $input[0].checkValidity() && this.passesInputCustomValidity($input) && this.passesCustomValidity($input);
    let isFocused = $input[0] && (document.activeElement && (document.activeElement.id === $input[0].id));
    let value = $input.val();

    if(this.set('isValid', isValid)) {
      if(isRequiredCheck) {
        $this.addClass('is-active validatePass');
      }
      if(isValChange && !value) {
        $this.removeClass('is-active');
      }

      $this.removeClass('validateFail').find('label').text($input.attr('placeholder'));
    } else {
      // only show tooltip if input field is focused element
      if(this.get('invalidTooltip') && isFocused) {
        Ember.run.next(() => {
          $input.parent().tooltip('show');
        });
      }

      if(this.get('setErrorMessage')) {
        this.set('error', this.get('setErrorMessage')(value));
      }

      $this.removeClass('validatePass');
      if(!isRequiredCheck) {
        let previousPlaceholder = this.get('placeholder');
        let placeholderText = (previousPlaceholder && _.isFunction(previousPlaceholder.replace) && previousPlaceholder.replace(/^Enter /, '')) || 'field';
        let errorMessage = this.get('error') || (placeholderText + ' cannot be blank');
        $this.addClass('validateFail is-active').find('label').text(errorMessage);
      } else if(isValChange && !isFocused) {
        $this.removeClass('is-active');
      }

    }

    this.validateForm();
  },

  focusIn: function() {
    this.handleInput();
  },

  focusOut: function(e) {
    this.$().removeClass('is-focused');
    this.validateInput();

    if (this.get('onFocusOut')) {
      this.sendAction('onFocusOut', e);
    }
  },

  inputType: function() {
    return this.get('type') || 'text';
  }.property('type'),

  inputClasses: function() {
    return "Input--floatLabel FloatLabel-input " + (this.get('klasses') || '');
  }.property('klasses'),

  handleInput: function() {
    let $this = this.$();
    let isRequired = this.get('required');
    let inputTag = $this.find(this.get('inputTag'))[0];
    if(inputTag && inputTag.value.length) {
      $this.addClass('is-active');
    } else if(!$this.hasClass('validateFail')) {
      $this.removeClass('is-active');
    }

    if($this.hasClass('validateFail') || isRequired) {
      this.validateInput(isRequired);
    } else {
      this.validateForm();
    }
  },

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, this.handleInput);

    if(this.get('prefix')) {
      this.setPrefixPadding();
    }

    if(this.get('googlePlaces')) {
      App.loadScript('//maps.googleapis.com/maps/api/js?libraries=places').done(() => {
        if (window.google && window.google.maps) {
          let placesAutocomplete = new window.google.maps.places.Autocomplete(this.$('.FloatLabel-input')[0], {
            types: ['geocode']
          });

          window.google.maps.event.addListener(placesAutocomplete, 'place_changed', () => {
            // sets value for input when a place is selected from autocomplete
            this.$('.FloatLabel-input').trigger('blur');
          });
        }

      });
    }
    this.$().on('validate', () => {
      this.focusIn();
      this.focusOut();
    });
    this.set('curValue', this.get('value') || '');
  }.on('didInsertElement'),

  setPrefixPadding: function() {
    let $prefix = this.$('.FloatLabel-prefix');
    let $input = this.$('.FloatLabel-input');
    let width = $prefix.width();
    let paddingLeft = window.parseInt($input.css('paddingLeft'), RADIX);
    let paddingForPrefix = width + paddingLeft;

    $input.attr('style', 'padding-left:' + paddingForPrefix + 'px !important'); // override buoy
  }.observes('prefix'),

  input: function () {
    this.handleInput();
    let val = this.dispatchInput();
    this.set('curValue', val);
    if(this.get('validateOnInput')) {
      this.validateInput();
    }
  },

  valChanged: function () {
    if (this.get('disableValidationAfterParentChange')) {
      return true;
    }

    //validate inputs that have had their value set by the parent controller
    Ember.run.next(() => {
      if(!(this.get('isDestroyed') || this.get('isDestroying')) && this.get('value') !== this.get('curValue')) {
        this.set('curValue', this.get('value'));
        this.validateInput(this.get('required'), true);
      }
    });
  }.observes('value'),

  actions: {
    onEnter: function() {
      if (this.get('onEnter')) {
        this.sendAction(this.get('onEnter'));
      }
    }
  }
});
