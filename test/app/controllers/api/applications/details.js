import Ember from 'ember';
import App from '../../../app';
import ENV from '../../../config/environment';
import {post} from '../../../utils/apiHelpers';

export default Ember.Controller.extend({
  modalTitle: function () {
    return 'App Details: ' + this.get('model.name');
  }.property('model'),

  actions: {
    onModalHide: function () {
      if(!this.get('isHidden')) {
        this.transitionToRoute('api.applications');
      }
    },
    reset: function () {
      let model = this.get('model');
      let uri = '/' + ENV['api-namespace'] + '/applications/' + model.get('id') + '/reset_secret';
      model.set('isResettingSecret', true);
      post(uri).then((resp) => {
        resp.json().then(function (json) {
          model.setProperties({
            secret: json.application.secret,
            isResettingSecret: false
          });
          App.NotificationsManager.show("Client secret reset.", 'notice');
        });
      }, function () {
        model.set('isResettingSecret', false);
        App.NotificationsManager.show('Sorry! Something went wrong!', 'alert');
      });
    },

    revoke: function() {
      let model = this.get('model');
      let uri = '/' + ENV['api-namespace'] + '/applications/' + model.get('id') + '/revoke_tokens';
      model.set('isRevoking', true);
      post(uri).then((resp) => {
        resp.json().then(function (json) {
          model.set('isRevoking', false);
          App.NotificationsManager.show(json.message, 'notice');
        });
      }, function () {
        model.set('isRevoking', false);
        App.NotificationsManager.show('Sorry! Something went wrong!', 'alert');
      });
    }
  }
});
