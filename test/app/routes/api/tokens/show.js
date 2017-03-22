import Ember from 'ember';

export default Ember.Route.extend({
  renderTemplate: function() {
    this.render('api.tokens.show', {
      into: 'application',
      outlet: 'modal',
      model: this.modelFor('settings.team')
    });
  }
});
