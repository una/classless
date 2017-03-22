import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  ticket: DS.belongsTo('ticket'),
  user: DS.belongsTo('supportUser'),
  admin: DS.belongsTo('supportUser'),
  feedback: DS.belongsTo('feedback', { async: true }),
  content: DS.attr(),
  createdAt: DS.attr(),
  feedbackSubmitted: DS.attr(),

  // We need to validate that the admin object is actually set as an admin
  // because some reply responses have admint set to a user who is not an admin.
  isFromAdmin: Ember.computed.equal('admin.isAdmin', true)
});
