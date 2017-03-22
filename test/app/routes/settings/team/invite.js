import Ember from 'ember';
import App from '../../../app';

export default Ember.Route.extend({
  titleToken: 'Invite Team Members',

  renderTemplate: function () {
    this.render('settings.team.invite', {
      into: 'application',
      outlet: 'modal',
      controller: 'settings.team.invite'
    });
  },

  model: function() {
    return App.User.get('currentContext');
  },

  onDeactivate: function () {
    let invitesSent = this.controller.get('invitesSent');
    if (invitesSent > 0) {
      this.controllerFor('settings.team').send('reloadMembers');
    }
  }.on('deactivate'),

  beforeModel: function() {
    if (!App.User.get('isOwner')) {
      this.transitionTo('settings.team');
    }
  },

  actions: {
    authenticate: function(provider) {
      let controller = this.controllerFor('settings.team.invite');
      this.get('torii').open(provider).then(function() {
        controller.set('isGmailAuthenticated', true);
      })
      .catch(function() {
        App.NotificationsManager.show('Oops! Something went wrong while authenticating!', 'alert');
      });
    }
  }
});
