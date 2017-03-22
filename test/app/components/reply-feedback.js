import Ember from 'ember';
import {ENTER_KEY, ESC_KEY} from '../constants';

const NegativeFeedbackPrompt = "That's too bad. Please let us know how we can do better.";
const PositiveFeedbackPrompt = "Awesome! Care to elaborate?";

export default Ember.Component.extend({
  feedbackPlaceholder: null,
  isExpanded: Ember.computed.notEmpty('feedbackHeader'),

  isPositive: Ember.computed.equal('feedbackHeader', PositiveFeedbackPrompt),

  feedback: "",
  reply: null,

  reset() {
    this.setProperties({
      feedback: '',
      feedbackPlaceholder: null
    });
  },

  resetFeedback: function() {
    this.reset();
  }.on('init'),

  keyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.keyCode === ENTER_KEY) {
      this.send('submitFeedback');
    }else if(event.keyCode === ESC_KEY) {
      this.reset();
    }
  },

  showHideFeedback: function (type) {
    this.set('feedbackHeader', type);

    let $parentList = this.$().closest('.replies');
    $parentList.css('height', 'auto');
    Ember.run.next( () => {
      $parentList.css('height', $parentList.height());
    });
  },

  feedbackSubmitted: function () {
    if (this.get('reply.feedbackSubmitted')) {
      this.showHideFeedback(null);
      this.reset();
    }
  }.observes('reply.feedbackSubmitted'),

  actions: {
    givePositiveFeedback() {
      this.set('positive', true);
      this.showHideFeedback(this.get('feedbackHeader') === PositiveFeedbackPrompt ? null : PositiveFeedbackPrompt);
    },

    giveNegativeFeedback() {
      this.set('positive', false);
      this.showHideFeedback(this.get('feedbackHeader') === NegativeFeedbackPrompt ? null : NegativeFeedbackPrompt);
    },

    closeFeedback() {
      this.showHideFeedback(null);
    },

    submitFeedback() {
      this.sendAction('submit',
        this.get('feedback'),
        this.get('positive'),
        this.get('reply.id'));
    }
  }
});
