import Ember from 'ember';

export default Ember.Component.extend({
  tagName: '',
  columns: 5,

  select: function (size) {
    let $me = Ember.$('.size-chooser-list .size-' + size.disk + '-' + size.id + ' .aurora-size');
    if(this.get('noToggling') && $me.hasClass('selected')) {
      return;
    }

    // this toggles the selected class on the clicked size ($me) and removes the selected state from all other sizes
    // chaining like this (using jQuery siblings()) allows us to toggle the class without any conditional statements
    $me.toggleClass('selected').closest('li').siblings().find('.aurora-size.selected:not(.disabled)').removeClass('selected');
    let selected = $me.hasClass('selected');
    this.set('selected', selected ? size : null);
    if(this.get('action')) {
      this.sendAction('action', this.get('selected'));
    }
  },

  keepSelectedOnDisabled : function () {
    Ember.run.scheduleOnce('afterRender', () => {
      let selected = this.get('selected');
      if(selected) {
        this.select(selected);
      }
    });
  }.observes('disabled'),

  removeSelected: function () {
    this.set('selected', null);
  }.observes('sizes'),

  actions: {
    select: function (size) {
      this.select(size);
    },

    onCustomVolumeChange: function (size) {
      this.sendAction('onCustomVolumeChange', size);
    }

  }
});
