import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['row', 'u-textAlignLeft', 'u-pt-2', 'u-pb-2'],
  classNameBindings: ['highlighted'],
  highlighted: false,
  isChecked: false,
  isDisabled: false,

  setup: function() {
    let authorized = this.isAuthorized();
    this.set('isChecked', authorized);
    this.set('isDisabled', authorized);

    if (authorized) {
      this.classNames.push('connected');
    }
  }.on('init'),

  click: function() {
    if (!this.isPreAuthorized()) {
      this.sendAction('action', this.get('account'));
    }
  },

  setClasses: function() {
    if (this.isAuthorized() && !this.isPreAuthorized()) {
      this.set('highlighted', true);
      this.set('isChecked', true);
    } else if (!this.isAuthorized()) {
      this.set('highlighted', false);
      this.set('isChecked', false);
    }
  }.observes('authorizations'),

  isAuthorized: function() {
    return this.get('authorizations').indexOf(this.get('account').get('id')) > -1;
  },

  isPreAuthorized: function() {
    return this.get('isDisabled') === true;
  }
});
