import Ember from 'ember';
import BaseController from '../base';

export default BaseController.extend({
  trackPageName: 'Droplet Show Access',
  dropletCtrl: Ember.inject.controller('droplet'),

  actions: {
    openConsole: function() {
      this.get('dropletCtrl').send('openConsole');
    },
    powerUpDroplet: function() {
      this.get('dropletCtrl').send('powerUpDroplet');
    },
    resetRootPassword: function() {
      let droplet = this.get('model');
      this.set('isResettingPassword', true);
      droplet.passwordReset().catch((err) => {
        this.errorHandler(err, this.get('dropletCtrl.eventMessageHash.password_reset').action);
      }).finally(() => {
        this.set('isResettingPassword', false);
      });
    }
  }
});