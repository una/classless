import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['replies-wrap'],

  collapsedStateChanged: function () {
    let isCollapsed = this.get('ticket.isCollapsed');
    let $collapsable = Ember.$('ul.collapsable');
    if(!isCollapsed) {
      $collapsable.css({
        height: 'auto',
        transition: 'none'
      });
      let height = $collapsable.height();
      $collapsable.css('height', '');
      Ember.run.next(function () {
        $collapsable.css({
          height: height + 'px',
          transition: ''
        });
      });
    } else {
      $collapsable.css('height', '');
    }
  }.observes('ticket.isCollapsed'),

  actions: {
    sendFeedback: function(...feedback) {
      this.sendAction('sendFeedback', ...feedback);
    }
  }
});
