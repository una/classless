import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  topic: DS.attr(),
  content: DS.attr(),
  viewedByUser: DS.attr('boolean', { default: false }),
  status: DS.attr(),
  isDelivered: DS.attr(),
  isCritical: DS.attr(),
  category: DS.attr(),
  createdAt: DS.attr(),
  lastReplyAt: DS.attr(),


  droplet: DS.belongsTo('droplet', {async: true}),
  user: DS.belongsTo('supportUser'),
  admin: DS.belongsTo('supportUser'),
  replies: DS.hasMany('reply', {async: true}),
  isUnread: Ember.computed.not('viewedByUser'),
  dropletId: Ember.computed.alias('droplet.id'),

  lastAdmin: function() {
    let repliesByAdmin = this.get('replies').filter(function (reply) {
      return reply.get('admin');
    });

    return repliesByAdmin.length ? repliesByAdmin.get('lastObject').get('admin') : null;
  }.property('replies'),

  isClosed: function() {
    return this.get('status') === 'closed';
  }.property('status')
});
