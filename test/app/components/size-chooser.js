import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['aurora-size', 'unbuttonized'],
  classNameBindings: ['disabled','selected','custom', 'isCustom:custom'],
  attributeBindings: ['isDisabled:disabled'],

  monthlyPrice: function () {
    let priceStr = this.get('size.monthlyPrice');
    let price = priceStr / 1;
    //is a round number
    if(price % 1 === 0) {
      return Math.floor(price);
    }
    return priceStr;
  }.property('size.monthlyPrice'),

  willRender: function () {
    if(this.get('size.custom') && this.get('size.disk')) {
      this.sendAction('onCustomVolumeChange', this.get('size.disk'));
    }
  },

  buttonCustom: function () {
    this.set('isCustom', this.get('size.custom'));
  }.on('willRender'),

  click: function () {
    if(this.get('action')) {
      this.sendAction('action', this.get('size'));
    }
  },

  select: function () {
    if(!this.get('size.selected')){
      this.click();
    }
  },

  actions: {
    onCustomVolumeChange: function (size) {
      this.sendAction('onCustomVolumeChange', size);
      this.select();
    }
  }


});
