import Ember from 'ember';
import App from '../../../app';
import ENV from '../../../config/environment';
import {post} from '../../../utils/apiHelpers';

export default Ember.Controller.extend({
  modalTitle: 'Edit personal access token',
  submitText: 'Update Token',
  tokenAction: 'updateToken',
  showRegenerate: true,

  setupForm: function () {
    this.setProperties({
      name: this.get('model.name'),
      scopeRead: this.get('model.scopeRead'),
      scopeWrite: this.get('model.scopeWrite'),
      isHidden: false
    });
  }.observes('model'),

  afterUpdate: function () {
    this.set('isHidden', true);
    this.transitionToRoute('api.tokens');
  },

  actions: {
    onModalHide: function () {
      if(!this.get('isHidden')) {
        this.transitionToRoute('api.tokens');
      }
      this.set('model', null);
    },

    regenerateToken: function () {
      let model = this.get('model');
      let uri = '/' + ENV['api-namespace'] + '/tokens/' + this.get('model.id') + '/reset_secret';
      post(uri).then((resp) => {
        return resp.json().then(function (json) {
          model.setProperties({
            token: json.token.token
          });
          App.NotificationsManager.show('Please copy your new personal access token now. It won\'t be shown again for your security.', 'notice');
        });
      }, function () {
        App.NotificationsManager.show('Sorry! Something went wrong!', 'alert');
      }).finally(function () {
        model.set('isUpdatingToken', false);
      });
      model.set('isUpdatingToken', true);
      this.afterUpdate();
    },

    updateToken: function () {
      let model = this.get('model');
      model.set('scopes', []);
      if (this.get('scopeRead')) {
        model.get('scopes').push('read');
      }
      if (this.get('scopeWrite')) {
        model.get('scopes').push('write');
      }
      model.set('name', this.get('name'));
      model.save().then(function() {
        App.NotificationsManager.show('Token updated', 'notice');
      }, () => {
        model.rollbackAttributes();
        App.NotificationsManager.show('Sorry! Error saving token. Please try again.', 'alert');
      });
      this.afterUpdate();
    }
  }
});
