import Ember from 'ember';
import AttachVolumeModalRoute from '../../../routes/attach-volume-modal';
import IndexPage from '../../../mixins/routes/index-page';

export default AttachVolumeModalRoute.extend(IndexPage, {
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
  hasDropletAutoComplete: true,

  getSnapshotModel: function (params) {
    return this.store.query('volumeSnapshot', params);
  },

  getModel: function(params) {
    if(this.get('isInitialLoad')) {
      return Ember.RSVP.hash({
        snapshots: this.getSnapshotModel(params),
        volumeSequenceNum: this.getSequenceNumber()
      }).then(this.autoCompleteModel.bind(this));
    } else {
      return Ember.RSVP.hash({
        snapshots: this.getSnapshotModel(params)
      });
    }
  },

  setupController: function(controller, model) {
    this.isInitialLoad = false;

    controller.set('snapshots', model.snapshots);

    this._super(controller, model);

    model.snapshots.forEach(function (snapshot) {
      if(snapshot.get('highlightNew')) {
        Ember.run.later(function () {
          snapshot.set('highlightNew', false);
        }, 4000); // eslint-disable-line no-magic-numbers
      }
    });
  }
});
