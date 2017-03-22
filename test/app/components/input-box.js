import Ember from 'ember';
import ClickAway from '../mixins/click-away';
import {DEBOUNCE_AMOUNT,
  ENTER_KEY,
  ESC_KEY,
  CURRENCY_USD_PRECISION
} from '../constants';

const PRECISION_LENGTH = CURRENCY_USD_PRECISION + 1; // account for decimal

export default Ember.Component.extend(ClickAway, {
  classNames: ['input-box'],
  classNameBindings: [
    'isSelected:input-box-selected',
    'error:input-box-error',
    'isEditable:input-box-editable'
  ],
  regex: '^[0-9]+(\\.[0-9]{0,2})?$',

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, this.onAfterRender);
  }.on('didInsertElement'),

  onAfterRender: function() {
    let $inputBoxValue = this.$('.input-box-value');
    if($inputBoxValue && $inputBoxValue.length) {
      $inputBoxValue.one('focus', this.onFocus.bind(this));
    }
    if (this.get('shouldValidateOnRender')) {
      this.validateValue();
    }
  },

  onFocus: function() {
    if(!this.get('isTyping')) {
      this.$('.input-box-value').click();
      if(this.$('input').length) {
        Ember.run.next(() => {
          this.$('input').one('blur', this.onInputBlur.bind(this));
        });
      }
    }
  },

  onInputBlur: function() {
    this.clickAway();
    Ember.run.next(() => {
      this.$('.input-box-value').one('focus', this.onFocus.bind(this));
    });
  },

  click: function() {
    if(this.get('onClick')) {
      this.sendAction('onClick', this.get('id'));
    }

    this.setFocus();
  },

  clickAway: function() {
    if(this.get('isTyping')) {
      this.set('isTyping', false);
      this.$('input').blur();
      this.updateValueFromInput();
    }
  },

  maxlength: function() {
    let value = this.get('maxValue') + '';
    // +3 for .00 cents
    return value.length + this.get('prefix').length + PRECISION_LENGTH;
  }.property('maxValue', 'prefix'),

  parseFloatFromValue: function(value) {
    if(value.length && value[0] === this.get('prefix')) {
      value = value.substr(1);
    }

    return window.parseFloat(value);
  },

  limitInputValuePrecision: function() {
    let value = this.get('inputValue') + '';

    // converts 1.123 to 1.12
    if(value) {
      let parts = value.split('.');
      if(parts.length > 1 && parts[1].length > CURRENCY_USD_PRECISION) {
        this.set('inputValue', parts[0] + '.' + parts[1].substr(0, CURRENCY_USD_PRECISION));
      }
    }
  },

  validate: function(value) {
    value = this.parseFloatFromValue(value);

    let minValue = this.get('minValue'),
        maxValue = this.get('maxValue'),
        error;

    if(isNaN(value) || !new RegExp(this.get('regex')).test(value)) {
      error = this.get('errorMessage');
    } else if(value < minValue) {
      error = this.get('minErrorMessage') || this.get('errorMessage');
    } else if(value > maxValue) {
      error = this.get('maxErrorMessage') || this.get('errorMessage');
    }

    this.setProperties({
      error: error
    });

    if (this.get('inputValue')) {
      Ember.run.debounce(this, this.updateValueFromInput, DEBOUNCE_AMOUNT);
    }
  },

  validateInputValue: function() {
    this.validate(this.get('inputValue'));
  }.observes('inputValue'),

  validateValue: function() {
    this.validate(this.get('value'));
  }.observes('value'),

  updateValueFromInput: function() {
    if (this.get('isDestroyed') || this.get('isDestroying')) {
      return;
    }
    let value = this.get('inputValue');

    if(!value || isNaN(value)) {
      value = 0;
    } else {
      value = this.parseFloatFromValue(value).toFixed(CURRENCY_USD_PRECISION);
    }

    this.setProperties({
      value: value,
      inputValue: value
    });
  },

  setFocus: function() {
    if(this.get('isEditable')) {
      this.setProperties({
        isTyping: true,
        originalValue: this.get('value')
      });

      this.sendAction('onClick', this.get('id'));

      Ember.run.next(() => {
        let $input = this.$('input');
        if($input && $input.length) {
          $input.one('focus', () => {
            Ember.run.next(() => {
              $input.select();
            });
          }).on('keyup', (event) => {
            this.validateInputValue();
            if(event.which === ENTER_KEY) {
              $input.off('keyup');
            } else if(event.which === ESC_KEY) {
              this.setProperties({
                value: this.get('originalValue'),
                isTyping: false
              });
              this.validateInputValue();
              $input.blur().off('keyup');
            } else {
              this.limitInputValuePrecision();
            }
          }).focus();
        }
      });
    }
  },

  actions: {
    setFocus: function() {
      this.setFocus();
    }
  }
});
