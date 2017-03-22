import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    revoke: function (app) {
      this.sendAction('revoke', app);
    }
  }
});