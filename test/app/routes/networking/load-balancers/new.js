import Ember from 'ember';
import ENV from '../../../config/environment';
import { get } from '../../../utils/apiHelpers';

export default Ember.Route.extend({
  titleToken: 'Create Load Balancer',

  networkingController: Ember.computed(function() {
    return this.controllerFor('networking');
  }),

  renderTemplate() {
    this.render('networking.loadBalancers.new', {
      into: 'application'
    });
  },

  model() {
    return Ember.RSVP.hash({
      loadBalancers: this.store.findAll('load-balancer'),
      regions: this.getRegions(),
      certificates: this.store.findAll('certificate')
    });
  },

  getRegions() {
    return get(`/${ENV['api-namespace']}/load_balancers/options_for_create`)
      .then((resp) => resp.json())
      .then((body) => body.regions)
      .catch(() => {
        throw new Error('Could not retrieve list of available regions.');
      });
  },

  beforeModel(transition) {
    if (transition.targetName === 'networking.loadBalancers.new') {
      this.get('networkingController').set('hideNetworkingHeader', true);
    }
  },

  deactivate() {
    this.controller.send('resetState');
    this.get('networkingController').set('hideNetworkingHeader', false);
  }
});
