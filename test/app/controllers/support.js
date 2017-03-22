import Ember from 'ember';

export default Ember.Controller.extend({
  applicationController: Ember.inject.controller('application'),
  isSearching: function () {
    return this.get('applicationController.currentPath') === 'support.suggestions';
  }.property('applicationController.currentPath')
});
