import Ember from 'ember';
import BaseController from '../base';

export default BaseController.extend({
  trackPageName: 'Droplet Show Resize',
  dropletCtrl: Ember.inject.controller('droplet'),

  filteredModel: function () {
    if(this.get('permanent')) {
      return this.get('model').expandSizes;
    }
    return this.get('model').resizeSizes;
  }.property('model', 'permanent'),

  submitDisabled: function () {
    return !this.get('selectedSize') || this.get('isResizing') || this.get('model.droplet.resizeEvent') || !this.get('model.droplet.isPoweredOff') || this.get('dropletCtrl.isBusy');
  }.property('selectedSize', 'isResizing', 'model.droplet.isPoweredOff', 'model.droplet.resizeEvent', 'dropletCtrl.isBusy'),

  resizeDone: function () {
    if(this.get('refreshModel')) {
      if(!this.get('unloaded')) {
        this.send('refreshModel');
      }
    }
    this.set('refreshModel', false);
  }.observes('refreshModel'),

  actions: {
    shutDownDroplet: function () {
      this.get('dropletCtrl').send('shutDownDroplet');
    },
    selectTab: function (tab) {
      this.setProperties({
        selectedSize: null,
        permanent: tab === 'permanent'
      });
    },
    toggleSizeSelection: function (size) {
      this.set('selectedSize', size);
    },
    afterModelRefresh: function () {
      this.set('isResizing', false);
    },
    pageUnloaded: function () {
      this.set('unloaded', true);
    },
    resize: function () {
      this.set('isResizing', true);
      this.get('model').droplet[this.get('permanent') ? 'expand' : 'resize'](this.get('selectedSize.id'))
        .catch((err) => {
          this.set('isResizing', false);
          this.errorHandler(err);
        });
    }
  }
});
