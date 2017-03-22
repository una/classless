import Ember from 'ember';
import App from '../app';

export default Ember.Controller.extend({

  newMonitorLink: App.featureEnabled('newMonitorCreate') ? 'monitors.new' : 'monitors.add',

  resetState: function (newState) {
    this.setProperties({
      searching: false,
      paginating: false,
      sorting: false
    });

    if(newState) {
      this.setProperties(newState);
    }
  },

  actions: {
    modelLoaded: function() {
      this.resetState({
        error: false
      });
    },
    modelError: function () {
      this.resetState({
        error: true
      });
      this.trackAction('Server Error');
    }
  }
});
