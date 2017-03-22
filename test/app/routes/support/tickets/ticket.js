import Ember from 'ember';

export default Ember.Route.extend({
  afterModel: function (model) {
    //mark unviewed tickets as viewed
    model.get('replies').then(() => {
      if (!model.get('viewedByUser')) {
        model.set('viewedByUser', true);
        model.save();
      }
    });
  },
  actions: {
    error: function(error) {
      // https://jira.internal.digitalocean.com/browse/AI-154
      if(error.message.toLowerCase() === 'the adapter rejected the commit because it was invalid') {
        this.transitionTo('support.index');
        return false;
      }
      return true;
    }
  }
});
