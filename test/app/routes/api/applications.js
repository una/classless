import Ember from 'ember';
import App from '../../app';

export default Ember.Route.extend({
  titleToken: 'API Apps',
  queryParams: {
    sort: {
      refreshModel: true
    },
    sort_direction: {
      refreshModel: true
    },
    page: {
      refreshModel: true
    }
  },
  getController: function () {
    return this.controllerFor('api.applications');
  },

  initRoute: function() {
    this.isFirstRoute = true;
  }.on('deactivate', 'init'),

  beforeModel: function() {
    if (!App.User.get('isContextOnboarded')) {
      this.transitionTo('welcome');
    }
  },

  getModel: function (params) {
    return this.store.query('application', params).then(null, () => {
      this.error = true;
      return Ember.A();
    });
  },

  model: function(params, transition) {
    this.showLoader = !!transition.queryParams.pendingSave;
    if(transition.queryParams.pendingSave) {
      return transition.queryParams.pendingSave.then(this.getModel.bind(this, params));
    }
    return this.getModel(params);
  },

  actions: {
    loading: function() {
      return this.isFirstRoute || this.showLoader;
    },

    didTransition: function () {
      this.isFirstRoute = false;
      //let the controller know what happened with the latest model load
      this.getController().send(this.error ? 'modelError' : 'modelLoaded');
    }
  }
});
