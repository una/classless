import Ember from 'ember';
import App from '../../app';

export default Ember.Route.extend({
  titleToken: 'API Tokens',
  beforeModel: function() {
    if (App.User.get('isContextOnboarded')) {
      this.transitionTo('api.tokens');
    } else {
      this.transitionTo('welcome');
    }
  }
});
