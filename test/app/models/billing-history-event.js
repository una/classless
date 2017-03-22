import DS from 'ember-data';

export default DS.Model.extend({
  description: DS.attr(),
  amount: DS.attr(),
  date: DS.attr(),
  invoiceId: DS.attr()
});
