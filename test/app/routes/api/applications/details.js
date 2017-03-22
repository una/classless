import Ember from 'ember';

export default Ember.Route.extend({
  renderTemplate: function() {
    this.render('api.applications.details', {
      into: 'application',
      outlet: 'modal'
    });
  }
});
