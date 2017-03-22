import Ember from 'ember';
import ResourceItem from '../components/resource-item';
import ClickAway from '../mixins/click-away';

const ESCAPE = 27;

export default ResourceItem.extend(ClickAway, {
  editing: true,
  tagName: 'div',

  setup: function () {
    this.set('origName', this.get('item.name'));
    Ember.run.scheduleOnce('afterRender', this, 'highlightName');
  }.on('willInsertElement'),

  highlightName: function () {
    let input = this.$('input')[0];
    input.setSelectionRange(0, input.value.length);
  },

  clickAway: function (e) {
    let name = this.get('item.name');
    this.set('item.name', this.get('origName'));
    this.sendAction('cancelEdit', this.origContext, e, this.get('item'), name);
  },

  keyDown: function (e) {
    if(e.keyCode === ESCAPE) {
      this.clickAway(e);
    }
  },

  actions: {
    submitEdit: function () {
      this.sendAction('submitEdit', this.get('item.name'), this.get('origName'));
    }
  }
});
