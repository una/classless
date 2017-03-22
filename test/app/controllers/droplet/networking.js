import Ember from 'ember';
import App from '../../app';
import BaseController from '../base';

export default BaseController.extend({
  trackPageName: 'Droplet Show Networking',
  dropletCtrl: Ember.inject.controller('droplet'),

  securityGroupsEnabled: App.featureEnabled('securityGroups'),

  actions: {
    enablePrivateNetworking: function() {
      let droplet = this.get('model');
      this.set('isEnablingPrivateNetwork', true);
      droplet.enableInterface('private').catch((err) => {
        this.errorHandler(err, this.get('dropletCtrl.eventMessageHash.enable_private_networking').action);
      }).finally(() => {
        this.set('isEnablingPrivateNetwork', false);
      });
    },

    enablePublicIpv6Networking: function() {
      let droplet = this.get('model');
      this.set('isEnablingIpv6', true);
      droplet.enableInterfaceV6('public').catch((err) => {
        this.errorHandler(err, this.get('dropletCtrl.eventMessageHash.enable_ipv6').action);
      }).finally(() => {
        this.set('isEnablingIpv6', false);
      });
    },
    shutDownDroplet: function() {
      this.get('dropletCtrl').send('shutDownDroplet');
    }
  }
});
