import Ember from 'ember';
import _ from 'lodash/lodash';

export default Ember.Component.extend({
  classNames: 'ellipsis-text',
  classNameBindings: ['isOverflowing'],

  isExpanded: false,
  first: true,

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, 'checkIfOverflowing');
  }.on('didInsertElement'),

  _trimText: function(str) {
    // the regex replaces multiple new lines with 1,
    // the second replace trims the extra whitespace
    return str.trim().replace(/\n\s*\n/g, '\n').replace(/[ \t\r]{2,}/g,"");
  },

  checkIfOverflowing: function () {
    let $me = this.$();
    if(!$me) {
      return;
    }
    if (this.get('isExpanded')) {
      this.set('isOverflowing', false);
      return;
    }
    let el = $me.addClass('testing')[0];
    let overflowing = el.clientWidth < el.scrollWidth;
    $me.removeClass('testing');
    if(!overflowing && _.isUndefined(this.get('isOverflowing'))) {
      return;
    }

    this.set('isOverflowing', overflowing);
    // textContent ensures new lines hang around
    let text = this._trimText(el.textContent);
    if(this.get('removeStr')) {
      text = text.replace(this.get('removeStr'), '');
    }
    this.set('textToShow', text);
  }.observes('isExpanded'),

  willRender: function() {
    if(!this.first) {
      Ember.run.next(this.checkIfOverflowing.bind(this));
    }
    this.first = false;
  }

});
