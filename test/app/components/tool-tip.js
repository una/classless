import Ember from 'ember';

export default Ember.Component.extend({

  attributeBindings: ['data-placement', 'data-toggle', 'title'],
  classNames: ['tooltip-wrap'],
  classNameBindings: ['isDisabled', 'multiline', 'overflow'],

  'data-toggle': 'tooltip',
  'data-placement': 'top',

  setup: function () {
    if(this.get('title')) {
      this.$().tooltip();
    }
  }.on('willInsertElement'),

  _show: function() {
    if(this.get('show')) {
      this.$().tooltip('show');
    }
  }.on('show'),

  _setup: function() {
    if(this.get('show')) {
      this._show();
    }
  }.on('didInsertElement'),

  teardown: function () {
    this.$().tooltip('destroy');
  }.on('willDestroyElement'),

  updateTitle: function () {
    let self = this;
    Ember.run(function() {
      self.$().attr('data-original-title', self.get('title'));
      self.$().tooltip('setContent');
    });
  }.observes('title')

});
