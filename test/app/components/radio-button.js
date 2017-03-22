import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'input',
  type: 'radio',
  attributeBindings: ['type', 'htmlChecked:checked', 'value', 'name', 'disabled'],

  value: null,
  checked: false,

  htmlChecked: Ember.computed('value', 'checked', function() {
    return this.get('value') === this.get('checked');
  }),

  change: function() {
    this.set('checked', this.get('value'));
    if(this.get('radioChange')) {
      this.sendAction('radioChange', this.get('value'));
    }
  },

  _setCheckedProp: function() {
    if (!this.$()) { return; }
    this.$().prop('checked', this.get('htmlChecked'));
  },

  _updateElementValue: function() {
    this._setCheckedProp();
  }.observes('htmlChecked')
});
