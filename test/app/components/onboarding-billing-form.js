import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    showTab: function (tabName) {
      this.set('billingTab', tabName);
    }
  }
});
