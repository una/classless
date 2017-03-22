import Ember from 'ember';
import App from '../../app';

export default Ember.Route.extend({
  titleToken: 'API Access',

  beforeModel: function() {
    if (!App.User.get('isContextOnboarded')) {
      this.transitionTo('welcome');
    }
  },

  model: function() {
    return this.store.query('application', { authorized: true }).then(null, () => {
      this.error = true;
      return Ember.A();
    });
  }
});
