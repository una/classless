import Ember from 'ember';

export default Ember.Route.extend({
  renderTemplate: function() {
    this.render('api.applications.show', {
      into: 'application',
      outlet: 'modal'
    });
  }
});
