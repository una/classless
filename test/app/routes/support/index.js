import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Support Center',
  beforeModel: function() {
    this.transitionTo('support.suggestions');
  }
});
