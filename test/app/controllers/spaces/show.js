import BaseController from '../base';

export default BaseController.extend({
  trackPageName: 'Spaces Show',

  bucket: function() {
    let bucket = this.get('model');
    if(this.get('stats')) {
      bucket.setProperties({
        numBytes: this.get('stats.num_bytes'),
        numObjects: this.get('stats.num_objects')
      });
    }
    return bucket;
  }.property('model', 'stats')

});