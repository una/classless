import Ember from 'ember';

export default Ember.Route.extend({
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
    this.initialModelLoad = true;
  }.on('deactivate', 'init'),

  model: function(params) {
    params = params || {};

    let droplet = this.modelFor('droplet');
    params.dropletId = droplet.get('id');

    if(this.initialModelLoad) {
      return Ember.RSVP.hash({
        droplet: droplet,
        history: this.store.query('history', params)
      });
    }

    return Ember.RSVP.hash({
      history: this.store.query('history', params)
    });
  },

  setupController: function(controller, models) {
    if(this.initialModelLoad) {
      this.initialModelLoad = false;
      controller.set('droplet', models.droplet);
    }
    controller.set('history', models.history);
  },

  actions: {
    loading: function() {
      return this.initialModelLoad;
    }
  }
});
