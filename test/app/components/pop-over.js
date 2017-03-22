import Ember from 'ember';
import Tooltip from '../components/tool-tip';

export default Tooltip.extend({
  classNames: 'popover',

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, () => {
      this.set('multiline', true);
      this.$().attr('data-html', true);
      this.updateContent();
      this._super();
    });
  }.on('willInsertElement'),

  updateContent: function() {
    let $elt = this.$('.js-popover-content');
    if($elt) {
      let html = $elt.html();
      this.$().attr('data-original-title', html);
      this.$().tooltip('setContent');
    }
  }
});
