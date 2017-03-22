import Ember from 'ember';
import SnapshotsIndexController from '../images/snapshots/droplets';

export default SnapshotsIndexController.extend({
  trackPageName: 'Droplet Show Snapshots',
  dropletCtrl: Ember.inject.controller('droplet'),
  routeName: 'droplet.snapshots',
  isDropletShow: true,

  powerButtonCopy: function () {
    return this.get('dropletCtrl.model.isPoweredOn') ? 'Take Live Snapshot' : 'Take Snapshot';
  }.property('dropletCtrl.model.isPoweredOn'),

  pollImageTransfers: function() {
    this._pollImageTransfers(this.get('transfers').filterBy('image.dropletId', this.get('droplet.id')));
  }.observes('transfers'),

  restoreDisabled: function () {
    return this.get('dropletCtrl.isBusy');
  }.property('dropletCtrl.isBusy'),

  submitIsDisabled: function () {
    return this.get('dropletCtrl.isBusy') || !this.get('dropletCtrl.model.canBeSnapshotted');
  }.property('dropletCtrl.isBusy', 'dropletCtrl.model.canBeSnapshotted'),

  actions: {
    onSubmitCreateImage: function () {
      this.set('createImageDropletId', this.get('droplet.id'));
      this.set('createImageName', this.get('newSnapshotName'));
      this._super();
    },
    shutDownDroplet: function () {
      this.get('dropletCtrl').send('shutDownDroplet');
    }
  }
});
