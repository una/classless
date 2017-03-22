import DS from 'ember-data';
import PollModel from '../mixins/poll-model';

export default DS.Model.extend(PollModel, {
  recipient_email: DS.attr(),
  sender_email: DS.attr(),
  image: DS.belongsTo('image'),

  pollTransfer: function() {
    return this.poll((transfer) => {
      return transfer.get('id') === null;
    });
  }
});
