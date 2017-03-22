import Ember from 'ember';

export default Ember.Component.extend({
  didInsertElement: function () {
    this.set('lastModel', this.get('model'));
  },
  collapsedStateChanged: function () {
    let $collapsable = this.$('.Ticket-supportBody') || Ember.$([]);
    let $collapsableHeader = $collapsable.find('h3');
    let isCollapsed = this.get('model.isCollapsed');

    //uggh, we need this conditional because ember re-uses HTML elements
    if(this.get('lastModel') && this.get('model') !== this.get('lastModel')) {
      $collapsable.css('height', '');
    } else {
      if(!isCollapsed) {
        let origHeight = $collapsable.height();
        $collapsable.css({
          height: 'auto',
          transition: 'none'
        });
        $collapsableHeader.css('white-space', 'normal');
        let height = $collapsable.height();
        $collapsable.css('height', origHeight);
        $collapsableHeader.css('white-space', '');
        Ember.run.next(() => {
          $collapsable.css({
            height: height,
            transition: ''
          });
        });
      } else {
        $collapsable.css('height', '');
      }
    }
    this.set('lastModel', this.get('model'));
  }.observes('model.isCollapsed')
});
