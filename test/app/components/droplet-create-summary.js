import Ember from 'ember';
import Popover from '../components/pop-over';

export default Popover.extend({
  regionFlagIcon: function() {
    return this.get('region.slug').replace(/\d/g, '').toLowerCase() + '1';
  }.property('region'),

  _updateContent: function() {
    Ember.run.next(() => {
      this.updateContent();
    });
  }.observes('image', 'region', 'size', 'volumes')
});
