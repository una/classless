import Ember from 'ember';

export default Ember.Component.extend({
  active: false,
  onSwitchOn: Ember.K,
  onSwitchOff: Ember.K,
  classNameBindings: ['isDisabled'],

  click: function() {
    let curr = this.get('active');
    if (curr) {
      this.get('onSwitchOff')();
    } else {
      this.get('onSwitchOn')();
    }
  }
});
