import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: ['filter', 'page'],
  needs: ['application'],
  applicationController: Ember.inject.controller('application'),

  /**
   * Bound property from query params which provides the current filter.
   *
   * Note: The default value of this property will always be hidden when active.
   *
   * @type {String}
   */
  filter: 'open',

  /**
   * Bound property from query params which provides the current page.
   *
   * Note: The default value of this property will always be hidden when active.
   *
   * @type {Integer}
   */
  page: 1,

  initialUnreadCount: Ember.computed.alias('model.meta.unreadCount'),

  currentUnreadCount: function () {
    return this.get('model').filter(record => {
      return record.get('viewedByUser') === false;
    }).get('length');
  }.property('model.@each.viewedByUser'),

  unreadOpenTicketCount: function () {
    if (this.get('openFilter')) {
      return this.get('model.meta.unreadOpenTicketCount') - this.get('initialUnreadCount') + this.get('currentUnreadCount');
    } else {
      return this.get('model.meta.unreadOpenTicketCount');
    }
  }.property('currentUnreadCount', 'openFilter'),

  unreadClosedTicketCount: function () {
    if (this.get('closedFilter')) {
      return this.get('model.meta.unreadClosedTicketCount') - this.get('initialUnreadCount') + this.get('currentUnreadCount');
    } else {
      return this.get('model.meta.unreadClosedTicketCount');
    }
  }.property('currentUnreadCount', 'closedFilter'),

  hasUnreadOpenTickets: Ember.computed.gte('unreadOpenTicketCount', 1),
  hasUnreadClosedTickets: Ember.computed.gte('unreadClosedTicketCount', 1),

  /**
   * Constructs a filtered array of tickets based on the isClosed predicate.
   *
   * @return {FilteredArrayProxy}
   */
  openTickets: function() {
    return this.get('model').filter(record => {
      return record.get('isClosed') === false && record.get('isNew') === false;
    });
  }.property('model', 'filter', 'page'),

  /**
   * Constructs a filtered array of tickets based on the isClosed predicate.
   *
   * @return {FilteredArrayProxy}
   */
  closedTickets: function() {
    return this.get('model').filter(record => {
      return record.get('isClosed') === true;
    });
  }.property('model', 'filter', 'page'),

  openTicketsCount: Ember.computed.reads('openTickets.length'),
  closedTicketsCount: Ember.computed.reads('closedTickets.length'),
  anyOpenTickets: Ember.computed.gte('openTickets.length', '1'),
  anyClosedTickets: Ember.computed.gte('closedTickets.length', '1'),

  noTickets: Ember.computed.not('model.meta.anyTickets'),


  emptyState: function () {
    let path = this.get('applicationController.currentPath');
    if (path !== 'support.tickets.new' && path !== 'support.tickets.loading') {
      return this.get('noTickets');
    }
    return false;
  }.property('model.meta.anyTickets', 'applicationController.currentPath'),

  openFilter: Ember.computed.equal('filter', 'open'),
  closedFilter: Ember.computed.equal('filter', 'closed'),

  newTicketClassNames: function () {
    let path = this.get('applicationController.currentPath');
    let classes = 'new_ticket Button Button--blue u-floatRight';
    if(path === 'support.tickets.new') {
      classes += ' is-disabled';
    }

    return classes;
  }.property('applicationController.currentPath'),

  shouldPaginate: Ember.computed.gte('model.meta.pages', 2), // eslint-disable-line no-magic-numbers
  hasNextPage: function () {
    return this.get('page') < this.get('model.meta.pages');
  }.property('model.meta.pages', 'page'),

  hasPrevPage: function () {
    return this.get('page') > 1;
  }.property('page'),

  prevPageNum: function () {
    return this.get('page') - 1;
  }.property('page'),

  nextPageNum: function () {
    return this.get('page') + 1;
  }.property('page'),

  actions: {
    showOpen: function () {
      this.transitionToRoute('support.tickets', {
        queryParams: {
          filter: 'open',
          page: 1
        }
      });
    },
    showClosed: function () {
      this.transitionToRoute('support.tickets', {
        queryParams: {
          filter: 'closed',
          page: 1
        }
      });
    }
  }
});
