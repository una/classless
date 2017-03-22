import Ember from 'ember';
import App from '../../../app';

export default Ember.Controller.extend({
  appController: Ember.inject.controller('api.applications'),
  onSubmit: 'createApplication',
  submitButtonText: 'Create Application',
  modalTitle: 'Register a new OAuth application',

  resetForm: function () {
    this.setProperties({
      homepage: '',
      description: '',
      name: '',
      callbackUrl: '',
      isHidden: false
    });
  }.on('init'),

  actions: {
    onModalHide: function () {
      if(!this.get('isHidden')) {
        this.transitionToRoute('api.applications');
      }
    },
    createApplication: function() {
      let application = this.store.createRecord('application', {
        name: this.get('name'),
        url: this.get('homepage'),
        redirectUri: this.get('callbackUrl'),
        description: this.get('description')
      });

      let savePromise = application.save().then(function() {
        App.NotificationsManager.show('Application created.', 'notice');
      }, () => {
        this.store.unloadRecord(application);
        App.NotificationsManager.show('Sorry! Error creating application. Please try again.', 'alert');
      });

      this.get('appController').set('newApplication', application);
      this.set('isHidden', true);

      //send the saving promise to the route so we dont show the first page before the token is saved
      this.transitionToRoute('api.applications', {
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
