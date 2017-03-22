import Ember from 'ember';
import InboundActions from 'ember-component-inbound-actions/inbound-actions';

export default Ember.Component.extend(InboundActions, {
  tagName: 'form',
  autocomplete: 'off',
  attributeBindings: ['autocomplete'],
  classNameBindings: ['className'],
  submitButtonText: 'Submit',

  setup: function () {
    Ember.run.scheduleOnce('afterRender', this, () => {
      this.$('input[required], textarea[required]').each((i, input) => {
        this.$(input).closest('.FloatLabel').addClass('is-required');
      });
      this.set('isSubmittable', this.checkIsSubmittable());
    });
  }.on('willInsertElement'),

  focusFirstEl: function () {
    if(!this.get('disableFocusFirstEl')) {
      Ember.run.next(() => {
        if (!this.isDestroyed) {
          this.$('input, textarea').first().focus();
        }
      });
    }
  }.on('didInsertElement'),

  onPropertyChange: function () {
    this.setup();
    this.rerender();
    this.focusFirstEl();
  }.observes('revalidateOnPropertyChange'),

  passesCustomValidity: function($input) {
    let customValidations = this.get('customValidations');
    let isValid = true;
    if(customValidations) {
      for(let key in customValidations) {
        if(customValidations.hasOwnProperty(key)) {
          if($input.is(key)) {
            isValid = isValid && customValidations[key]($input.val());
          }
        }
      }
    }
    return isValid;
  },

  checkIsSubmittable: function () {
    if (this.$('.validateFail') && this.$('.validateFail').length) {
      return false;
    }
    let $requiredFields = this.$('.is-required');
    let isValid = true;
    let $input;
    if($requiredFields && $requiredFields.length) {
      $requiredFields.each((i, field) => {
        let $field = this.$(field);
        if($field.is('.aurora-auto-complete:not(.dont-show-selected)')) {
          let input = $field.find('input')[0];
          isValid = isValid && ($field.find('.Resource.selected').length || (input.getAttribute('pattern') && input.checkValidity()));
        } else if ($field.is('select')) {
          isValid = isValid && ($field.val() || $field.is(':disabled'));
        } else {
          $input = $field.find('input, textarea');
          isValid = isValid && $input.length && $input[0].checkValidity() && this.passesCustomValidity($input);
        }
      });
    }
    return isValid;
  },

  buttonColor: function () {
    return this.get('submitButtonColor') || 'blue';
  }.property('submitButtonColor'),

  resetForm: function () {
    // reset input fields
    this.$()[0].reset();
    this.$('.FloatLabel').removeClass('validatePass validateFail is-active');

    this.$('.aurora-auto-complete').trigger('resetForm');
    this.set('isSubmittable', this.checkIsSubmittable());
  },

  actions: {
    validateForm: function () {
      const isSubmittable = this.checkIsSubmittable();

      if(!(this.get('isDestroyed') || this.get('isDestroying'))) {
        this.set('isSubmittable', isSubmittable);
      }

      if (this.get('onValidateForm')) {
        this.sendAction('onValidateForm', isSubmittable);
      }
    },
    onSubmit: function () {
      if (this.get('onSubmit')) {
        this.sendAction('onSubmit', this.origContext);
        if(this.get('resetOnSubmit')) {
          this.resetForm();
        }
      }
    }
  }
});
