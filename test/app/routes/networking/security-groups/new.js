import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Create Firewall',

  resetControllerState: function() {
    this.controller.send('resetState');
  }.on('deactivate'),

  renderTemplate: function() {
    this.render('networking.securityGroups.new', {
      into: 'networking',
      controller: 'networking.securityGroups.new'
    });
  }
});
