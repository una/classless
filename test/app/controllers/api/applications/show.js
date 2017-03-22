import Ember from 'ember';
import App from '../../../app';

export default Ember.Controller.extend({

  onSubmit: 'updateApplication',
  submitButtonText: 'Update Application',

  setupForm: function () {
    this.setProperties({
      name: this.get('model.name'),
      homepage: this.get('model.url'),
      description: this.get('model.description'),
      callbackUrl: this.get('model.redirectUri'),
      isHidden: false
    });
  }.observes('model'),

  modalTitle: function() {
    return 'Edit application';
  }.property('model'),

  actions: {
    onModalHide: function () {
      if(!this.get('isHidden')) {
        this.transitionToRoute('api.applications');
      }
      this.set('model', null);
    },

    updateApplication: function() {
      let model = this.get('model');
      model.setProperties({
        name: this.get('name'),
        url: this.get('homepage'),
        redirectUri: this.get('callbackUrl'),
        description: this.get('description')
      });

      this.model.save().then(function() {
        App.NotificationsManager.show('Application updated.', 'notice');
      }, () => {
        model.rollbackAttributes();
        App.NotificationsManager.show('Sorry! Error saving application. Please try again.', 'alert');
      });
      this.set('isHidden', true);
      this.transitionToRoute('api.applications');
    }

  }
});
