import Ember from 'ember';
import _ from 'lodash/lodash';
import App from '../../../../app';

export default Ember.Route.extend({
  // This updates the model to mark tickets as collapsed or not based on the following logic:
  // 1. The last reply should always be open
  // 2. The last N replies from an admin should be open

   model: function() {
     let ticket = this.modelFor('support.tickets.ticket');
     return ticket.get('replies')
      .then((replies) => {
        let foundNonAdmin = false;
        let collapsedReplies = replies.length;
        let alwaysOpen;
        replies.toArray().reverse().forEach((item, i) => {
          if(!item.get('isFromAdmin')) {
            foundNonAdmin = true;
            alwaysOpen = !i;
          } else {
            alwaysOpen = !foundNonAdmin;
          }
          item.set('alwaysOpen', alwaysOpen);
          if(alwaysOpen) {
            collapsedReplies--;
          }
        });
        ticket.set('wasClosed', ticket.get('isClosed'));
        ticket.set('isCollapsed', collapsedReplies > 0);
        ticket.set('collapsedReplyCount', collapsedReplies);
        return ticket;
      });
   },

  actions: {
    /**
     * Constructs a feedback record and submits it to the API. Feedback is always
     * submitted on behalf of the current user.
     *
     * @param  {String}  feedback   Feedback message
     * @param  {Boolean} isPositive
     * @param  {Integer} replyId    ID of the reply to submit feedback to
     *
     * @return {Promise}
     */
    sendFeedback(feedback, isPositive, replyId) {
      if (!_.isString(feedback) || _.isEmpty(feedback.trim())) {
        App.NotificationsManager.show('Oops! Feedback can\`t be blank!', 'alert');
        return;
      }
      return this.store.find('reply', replyId).then((reply) => {
        return this.store.createRecord('feedback', {
          positive: isPositive,
          reply: reply,
          feedback: feedback.trim()
        }).save().then(function () {
          reply.set('feedbackSubmitted', true);
        });
      }).catch(function() {
        App.NotificationsManager.show('Oops! Something went wrong submitting your feedback!', 'alert');
      });
    },

    createReply(reply) {
      let model = this.currentModel;
      reply.ticket = model;
      reply.alwaysOpen = true;
      this.store.createRecord('reply', reply).save().then(() => {
        let transition = function () {
          this.transitionTo('support.tickets.ticket.index', model.id, {
            queryParams: {
              filter: 'open',
              page: 1
            }
          });
        }.bind(this);

        if(model.get('status') !== 'open') {
          model.set('status', 'open');
          model.save().then(transition);
        } else {
          transition();
        }
      });
    },

    closeTicket() {
      let model = this.currentModel;
      model.set('status', 'closed');
      model.save().then(() => {
        this.transitionTo('support.tickets.ticket.index', model.id, {
          queryParams: {
            filter: 'closed',
            page: 1
          }
        });
      });
    },

    collapseTicket() {
      let sel = window.getSelection().toString();
      // DO NOT COLLAPSE ON HIGHLIGHT
      if(!sel) {
        let model = this.currentModel;
        model.set('isCollapsed', !model.get('isCollapsed'));
      }
    }

  }
});
