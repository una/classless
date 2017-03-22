import DS from 'ember-data';

export default DS.Model.extend({
  identityType: DS.attr(),
  userId: DS.attr(),
  token: DS.attr(),
  scope: DS.attr(),
  createdAt: DS.attr(),
  updatedAt: DS.attr(),
  isActive: DS.attr(),
  username: DS.attr(),
  webhookUrl: DS.attr(),
  channel: DS.attr(),
  type: DS.attr()
});
