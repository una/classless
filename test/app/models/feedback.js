import DS from 'ember-data';

export default DS.Model.extend({
  reply: DS.belongsTo('reply', {async: true}),
  feedback: DS.attr(),
  positive: DS.attr('boolean')
});
