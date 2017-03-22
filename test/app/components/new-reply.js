import Ember from 'ember';
import {ENTER_KEY, ESC_KEY} from '../constants';

export default Ember.Component.extend({
  isExpanded: false,
  replyBody: "",

  lastAdmin: null,

  replyToName: function() {
    let lastAdmin = this.get('lastAdmin');
    if (lastAdmin && lastAdmin.get('fullName')) {
      return 'Reply to ' + lastAdmin.get('fullName');
    }else{
      return 'Send a Response';
    }
  }.property('lastAdmin'),

  reset() {
    this.setProperties({
      replyBody: '',
      isExpanded: false
    });
  },

  keyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.keyCode === ENTER_KEY) {
      this.send('sendReply');
    }else if(event.keyCode === ESC_KEY) {
      this.reset();
    }
  },

  actions: {
    closeTicket() {
      this.sendAction('closeTicket');
    },

    sendReply() {
      let reply = this.get('replyBody').trim();
      if(reply) {
        this.sendAction('createReply', {
          content: this.get('replyBody')
        });
        this.reset();
      }
    }
  }
});