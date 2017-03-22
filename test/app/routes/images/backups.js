import Ember from 'ember';
import AutoCompleteRoute from '../../routes/autocomplete';

export default AutoCompleteRoute.extend({
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
    // only get droplets that have backups
    params.has_backups = 1;

    if(this.get('isInitialLoad')) {
      return Ember.RSVP.hash({
        droplets: this.store.query('droplet', params).then(null, () => {
          return Ember.A();
        })
      }).then(this.autoCompleteModel.bind(this));
    } else {
      return Ember.RSVP.hash({
        droplets: this.store.query('droplet', params).then(null, () => {
          return Ember.A();
        })
      });
    }
  },


  findBackupsForDroplet: function(droplet) {
    function after (backups) {
      droplet.set('backups', backups);
      droplet.set('showBackups', true);
      droplet.set('isLoadingBackups', false);
    }

    droplet.set('isLoadingBackups', true);

    return this.store.query('image', {
      type: 'backup',
      dropletId: droplet.id
    }).then(after, after.bind(null, Ember.A()));
  },

  setupController: function(controller, models) {
    if(this.get('isInitialLoad')) {
      this.set('isInitialLoad', false);
      this._super(controller, models);
    }

    controller.set('droplets', models.droplets);
    this.controller = controller;
  },

  deactivate: function() {
    this.controller.send('removeAllPollingEvents');
  },

  actions: {
    loading: function () {
      return this.get('isInitialLoad');
    },

    getBackupsForDroplet: function (droplet) {
      this.findBackupsForDroplet(droplet);
    },

    didTransition: function () {
      //let the controller know what happened with the latest model load
      this.controllerFor('images.backups').send('modelLoaded');
    }
  }
});
