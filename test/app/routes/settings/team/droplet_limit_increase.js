import Ember from 'ember';
import App from '../../../app';

export default Ember.Route.extend({
  titleToken: 'Droplet Limit Increase',

  renderTemplate: function () {
    this.render('settings.team.droplet_limit_increase', {
      into: 'application',
      outlet: 'modal',
      controller: 'settings.team.droplet_limit_increase'
    });
  },

  model: function() {
    return App.User.get('currentContext');
  }
});
