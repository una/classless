import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Edit Team',
  renderTemplate: function () {
    this.render('settings.team.edit', {
      into: 'application',
      outlet: 'modal',
      controller: 'settings.team.edit'
    });
  }
});
