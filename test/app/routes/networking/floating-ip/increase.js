import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Increase Floating IP Limit',

  renderTemplate: function () {
    this.render('networking.floatingIp.increase', {
      into: 'application',
      outlet: 'modal',
      controller: 'networking.floatingIp.increase'
    });
  },

  onDeactivate: function() {
    this.controller.resetProperties();
  }.on('deactivate')
});