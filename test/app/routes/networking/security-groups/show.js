import Ember from 'ember';

export default Ember.Route.extend({
  renderTemplate: function() {
    this.render('networking.securityGroups.show', {
      into: 'networking',
      controller: 'networking.securityGroups.show'
    });
  }
});
