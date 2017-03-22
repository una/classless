import Ember from 'ember';

export default Ember.Component.extend({
  isImageTransferring: function() {
    let image = this.get('image');
    let accountTransfers = this.get('accountTransfers').rejectBy('transferred');
    let isTransferring = false;

    if(accountTransfers) {
      if(accountTransfers.findBy('image.id', image.get('id'))) {
        isTransferring = true;
      }
    }

    return isTransferring || (image.get('ongoingTransfers') && image.get('ongoingTransfers.length')) || image.get('ongoingRegionTransfers');
  }.property('image', 'image.id', 'image.ongoingRegionTransfers', 'image.ongoingTransfers', 'accountTransfers', 'accountTransfers.@each.image', 'accountTransfers.@each.image.id')
});
