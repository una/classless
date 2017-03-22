import Ember from 'ember';
import App from '../../../app';

export default Ember.Controller.extend({
  tokensController: Ember.inject.controller('api.tokens'),
  modalTitle: 'New personal access token',
  submitText: 'Generate Token',
  tokenAction: 'generateToken',

  resetForm: function () {
    this.setProperties({
      scopeRead: true,
      scopeWrite: true,
      name: null,
      isHidden: false
    });
  }.on('init'),

  actions: {
    onModalHide: function () {
      if(!this.get('isHidden')) {
        this.transitionToRoute('api.tokens');
      }
    },
    generateToken: function () {
      let token = this.store.createRecord('token', {
        name: this.get('name'),
        scopes: []
      });

      if (this.get('scopeRead')) {
        token.get('scopes').push('read');
      }
      if (this.get('scopeWrite')) {
        token.get('scopes').push('write');
      }

      let savePromise = token.save().then(function() {
        App.NotificationsManager.show('Please copy your new personal access token now. It won\'t be shown again for your security.', 'notice');
      }, () => {
        this.store.unloadRecord(token);
        App.NotificationsManager.show('Sorry! Error generating token. Please try again.', 'alert');
      });

      this.get('tokensController').set('newToken', token);
      this.set('isHidden', true);

      //send the saving promise to the route so we dont show the first page before the token is saved
      this.transitionToRoute('api.tokens', {
        queryParams: {
          page: 1,
          pendingSave: savePromise,
          sort: 'created_at',
          sort_direction: 'desc'
        }
      });
    }
  }
});
