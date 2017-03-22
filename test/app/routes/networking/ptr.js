import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'PTR Records',
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

  initRoute: function() {
    this.set('isInitialLoad', true);
  }.on('deactivate', 'init'),

  model: function(params) {
    return this.store.query('ptrRecord', params);
  },

  setupController: function(controller, models) {
    if(this.get('isInitialLoad')) {
      this.set('isInitialLoad', false);
    }

    this._super(controller, models);
  },

  actions: {
    loading: function() {
      return this.get('isInitialLoad');
    },
    didTransition: function () {
      //let the controller know what happened with the latest model load
      this.controllerFor('networking.ptr').send('modelLoaded');
    }
  }
});
