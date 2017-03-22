import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  actorIp: DS.attr(),
  createdAt: DS.attr(),
  actor: DS.attr(),
  user: DS.belongsTo('user')
});
