import Ember from 'ember';
import AutoCompleteController from '../../controllers/autocomplete';

export default AutoCompleteController.extend({
  trackPageName: 'Droplet Show Kernel',
  dropletCtrl: Ember.inject.controller('droplet'),

  selectedKernelId: null,

  isChangeKernelButtonDisabled: function() {
    return this.get('dropletCtrl.isBusy') ||
           this.get('isChangingKernel') ||
           this.get('dropletCtrl.model.changeKernelEvent') ||
           this.get('selectedKernelId') === null;
  }.property('dropletCtrl.isBusy', 'isChangingKernel', 'dropletCtrl.model.changeKernelEvent', 'selectedKernelId'),

  kernelDisabledModelIndices: function() {
    let indices = [];
    let currentKernelId = this.get('droplet.kernel.id');

    if (currentKernelId) {
      currentKernelId = currentKernelId.toString();
    }

    this.get('kernels').forEach(function(model, index) {
      if(currentKernelId === model.get('id')) {
        indices.push({ index: index, reason: 'Your Droplet is already using this Kernel'});
      }
    });
    return indices;
  }.property('droplet.kernel'),

  actions: {
    onSelectKernel: function(selected) {
      let kernelId = null;
      if(selected) {
        kernelId = selected.get('id');
      }
      this.set('selectedKernelId', kernelId);
    },
    onUnselectKernel: function() {
      this.set('selectedKernelId', null);
    },
    changeKernel: function() {
      let droplet = this.get('droplet');
      this.set('isChangingKernel', true);
      droplet.changeKernel(this.get('selectedKernelId')).catch((err) => {
        this.errorHandler(err, this.get('dropletCtrl.eventMessageHash.change_kernel').action);
      }).finally(() => {
        this.set('isChangingKernel', false);
      });
    },
    mountRecoveryKernel: function() {
      let droplet = this.get('droplet');
      this.set('isChangingKernel', true);
      droplet.mountRecoveryKernel().catch((err) => {
        this.errorHandler(err, this.get('dropletCtrl.eventMessageHash.change_kernel').action);
      }).finally(() => {
        this.set('isChangingKernel', false);
      });
    }
  }
});
