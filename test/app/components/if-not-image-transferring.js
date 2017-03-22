import IfImageTransferring from './if-image-transferring';

export default IfImageTransferring.extend({
  isNotImageTransferring: function() {
    return !this.get('isImageTransferring');
  }.property('isImageTransferring')
});
