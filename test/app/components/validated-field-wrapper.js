import Ember from 'ember';

/**
  Example Usage:

  ```
  {{validated-field-wrapper
    warningMessage="Something"
    errorMessage="Something"
    foo="foo"
    bar="bar"
  }}
  ```
  */
export default Ember.Component.extend({
  classNames: ['ValidatedInput'],
  classNameBindings: ['showErrorMessage:HasError', 'showWarningMessage:HasWarning'],
  errorMessage: '',
  warningMessage: '',
  showWarningMessage: Ember.computed('warningMessage', function() {
    return this.get('warningMessage.length') > 0;
  }),
  showErrorMessage: Ember.computed('errorMessage', function() {
    return this.get('errorMessage.length') > 0;
  })
});
