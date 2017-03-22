import Ember from 'ember';
import BaseController from '../base';

export default BaseController.extend({
  trackPageName: 'Droplet Show Power',
  dropletCtrl: Ember.inject.controller('droplet'),

  actions: {
    powerUpDroplet: function() {
      this.get('dropletCtrl').send('powerUpDroplet');
    },
    shutDownDroplet: function() {
      this.get('dropletCtrl').send('shutDownDroplet');
    },
    powerCycleDroplet: function() {
      let droplet = this.get('model');
      this.set('isCyclingPower', true);
      droplet.powerCycle().catch((err) => {
        this.errorHandler(err, this.get('dropletCtrl.eventMessageHash.power_cycle').action);
      }).finally(() => {
        this.set('isCyclingPower', false);
      });
    }
  }
});