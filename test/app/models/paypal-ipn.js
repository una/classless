import DS from 'ember-data';

export default DS.Model.extend({
  paymentStatus: DS.attr(),

  isFailed: function() {
    return this.get('paymentStatus') === 'failed';
  }.property('paymentStatus')
});
