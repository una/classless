import Ember from 'ember';
import IndexPage from '../../../mixins/routes/index-page';

export default Ember.Route.extend(IndexPage, {
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

  getModel: function(params) {
    params.type = 'snapshot';
    if(this.isInitialLoad) {
      return Ember.RSVP.hash({
        regions: this.store.findAll('region', { reload: true }),
        snapshots: this.store.query('image', params),
        transfers: !this.isDropletShow ? this.modelFor('images.snapshots').transfers : this.store.findAll('accountTransfer')
      });
    } else {
      return Ember.RSVP.hash({
        snapshots: this.store.query('image', params)
      });
    } 
  },

  setupController: function(controller, models) {
    if(this.isInitialLoad) {
      this.isInitialLoad = false;
      controller.setProperties({
        regions: models.regions,
        transfers: models.transfers.slice()
      });
    }
    controller.set('snapshots', models.snapshots);

    this.controller = controller;
  },

  onDeactivate: function() {
    this.controller.send('removeAllPollingEvents');
  }.on('deactivate'),

  actions: {
    didTransition: function () {
      //let the controller know what happened with the latest model load
      this.controller.send('modelLoaded');
      this._super();
    }
  }
});
