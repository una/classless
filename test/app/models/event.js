import DS from 'ember-data';
import PollModel from '../mixins/poll-model';

export default DS.Model.extend(PollModel, {
  type: DS.attr(),
  progress: DS.attr('number'),
  dropletId: DS.attr(),
  createdAt: DS.attr('date'),
  region: DS.belongsTo('region'),
  status: DS.attr(),
  isAttachAndDetach: DS.attr(),

  hasError: function () {
    return this.get('status') === 'error';
  }.property('status'),

  isDone: function () {
    let status = this.get('status');
    return status === 'done';
  }.property('status')
});
