import Ember from 'ember';
import ValidationForm from '../components/form-with-validation';

export default Ember.Component.extend({
  classNames: ['FloatLabelSelect', 'Select'],
  classNameBindings: [
    'isActive',
    'noCheckmark',
    'selectedOption:is-selected',
    'required:select-is-required',
    'passesValidation:validatePass',
    'failedValidation:validateFail'
  ],

  onSetup: function() {
    let parentView = this.get('parentView');

    while (parentView && !(parentView instanceof ValidationForm)) {
      parentView = parentView.get('parentView');
    }

    this.validationForm = parentView;
  }.on('willInsertElement'),

  // `options` can be an array of strings or an array of objects of the
  // following shape: { value: 'someValue', label: 'Some label' }
  normalizedOptions: function() {
    const options = this.get('options');

    if (!options) {
      return [];
    }

    if (options[0] && typeof options[0] === 'string') {
      return options.map((option) => ({
        value: option,
        label: option
      }));
    } else {
      return options;
    }
  }.property('options'),

  validateForm: function() {
    if (this.validationForm) {
      Ember.run.next(() => {
        if (!this.get('isDestroyed') && !this.get('isDestroying')) {
          this.validationForm.send('validateForm');
        }
      });
    }
  },

  passesValidation: function() {
    return this.get('required') && this.get('selectedOption');
  }.property('required', 'selectedOption'),

  isActive: function() {
    return this.get('selectedOption') || this.get('failedValidation');
  }.property('selectedOption', 'failedValidation'),

  selectedOptionChanged: function () {
    // Re-validate when selectedOption is changed by a parent component or controller
    Ember.run.next(() => {
      if (this.get('required')) {
        this.validateForm();
      }
    });
  }.observes('selectedOption').on('init'),

  actions: {
    onChange: function(e) {
      this.set('selectedOption', e.target.value);
      this.set('failedValidation', false);

      if (this.get('onChange')) {
        this.sendAction('onChange', e);
      }

      if (this.get('required')) {
        this.validateForm();
      }
    },

    onFocus: function(e) {
      if (this.get('onFocus')) {
        this.sendAction('onFocus', e);
      }
    },

    onKeyPress: function(e) {
      if (this.get('onKeyPress')) {
        this.sendAction('onKeyPress', e);
      }
    },

    onFocusOut: function(e) {
      if (this.get('required')) {
        this.set('failedValidation', !this.get('selectedOption'));

        this.validateForm();
      }

      if (this.get('onFocusOut')) {
        this.sendAction('onFocusOut', e);
      }
    }
  }
});
