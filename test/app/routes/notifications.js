import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Notifications',
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

  model: function (params) {
    this.error = false;
    this.currentParams = params;
    return this.store.query('notification', params).then(null, () => {
      this.error = true;
      return Ember.A();
    });
  },

  initRoute: function() {
    this.initialModelLoad = true;
  }.on('deactivate', 'init'), //deactivate not activate, so we can reset before actions/loading fires next

  setupController: function (controller, model) {
    controller.set('model', model);
    if(this.initialModelLoad) {
      controller.set('searchQuery', this.currentParams.query);
    }
  },

  actions: {
    loading: function () {
      //show loading substate intially, all other loading states are handled by spinners
      return this.initialModelLoad;
    },

    didTransition: function () {
      this.initialModelLoad = false;
      //let the controller know what happened with the latest model load
      this.controllerFor('notifications').send(this.error ? 'modelError' : 'modelLoaded');
    }
  }
});
