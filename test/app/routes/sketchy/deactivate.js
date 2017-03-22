import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Verify',
  renderTemplate: function () {
    this.render('components.deactivate-modal', {
      into: 'application',
      outlet: 'modal',
      controller: 'deactivate'
    });
  }
});
