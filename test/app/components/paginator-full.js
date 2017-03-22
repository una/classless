import Ember from 'ember';

const EDGE = 2; // Show this many buttons near the "edge"
const HALO = 2; // Show this many buttons "around" current page button
const GAPLESS = EDGE + HALO + 1 + HALO + EDGE; // For how many pages it is OK to not show the ellipsis aka gap
const ONE_GAP = EDGE + HALO + 1 + HALO; // How many buttons to show near the edge, when current page is close to edge
const EDGE_TO_CURR = EDGE + HALO + 1; // How far from the edge can current page be until to let it not show the gap

Ember.LinkComponent.reopen({
  attributeBindings: ['data-page']
});

export default Ember.Component.extend({

  classNames: 'Pagination u-mb-4 u-mt-6',
  classNameBindings: 'klasses',

  items: function() {
    let items = [];
    let pages = this.get('pages');
    let currentPage = this.get('currentPage');

    // Number of pages is small (less than GAPLESS amount)
    if (pages <= GAPLESS) {
      for (let i = 1; i <= pages; i++) {
        items.push({ value: i, isButton: true, active: i === currentPage });
      }
    } else {
      // Number of pages is more than GAPLESS amount AND current page is close to left edge
      if (currentPage <= EDGE_TO_CURR) {
        for (let i = 1; i <= ONE_GAP; i++) {
          items.push({ value: i, isButton: true, active: i === currentPage });
        }

        items.push({isButton: false});

        for (let i = pages - (HALO - 1); i <= pages; i++) {
          items.push({ value: i, isButton: true, active: false });
        }
      }
      // Number of pages is more than GAPLESS amount AND current page is further away from left edge
      if (currentPage > EDGE_TO_CURR && currentPage <= pages - EDGE_TO_CURR) {
        for (let i = 1; i <= HALO; i++) {
          items.push({ value: i, isButton: true, active: false });
        }

        items.push({isButton: false});

        for (let i = currentPage - HALO; i <= currentPage + HALO; i++) {
          items.push({ value: i, isButton: true, active: i === currentPage });
        }

        items.push({isButton: false});

        for (let i = pages - (HALO - 1); i <= pages; i++) {
          items.push({ value: i, isButton: true, active: false });
        }
      }
      // Number of pages is more than GAPLESS amount AND current page is close to right edge
      if (currentPage > pages - EDGE_TO_CURR) {
        for (let i = 1; i <= HALO; i++) {
          items.push({ value: i, isButton: true, active: false });
        }

        items.push({isButton: false});

        for (let i = pages - (ONE_GAP - 1); i <= pages; i++) {
          items.push({ value: i, isButton: true, active: i === currentPage });
        }
      }
    }

    return items;

  }.property('pages', 'currentPage'),

  onFirstPage: function() {
    return this.get('currentPage') === 1;
  }.property('currentPage'),

  onLastPage: function() {
    return this.get('currentPage') === this.get('pages');
  }.property('pages', 'currentPage'),

  nextPage: function() {
    return this.get('currentPage') + 1;
  }.property('currentPage'),

  prevPage: function() {
    return this.get('currentPage') - 1;
  }.property('currentPage'),

  afterLoading: function() {
    if (!this.get('isLoading')) {
      this.$('.hasLoader').removeClass('hasLoader');
      let scrollToSelector = this.get('scrollToAfterLoad');
      if(scrollToSelector) {
        let item = this.$().closest('body').find(scrollToSelector)[0];
        if(item) {
          window.scrollBy(0, item.getBoundingClientRect().top);
        }
      }
    }
  }.observes('isLoading'),

  click: function(e) {
    let clicked = Ember.$(e.target).closest('a');

    if (!clicked.is('.active')) {
      clicked.addClass('hasLoader');
      if(!this.get('useActions')) {
        this.sendAction();
      }
    }
  },
  actions: {
    linkClick: function (page) {
      this.sendAction('action', page);
    }
  }
});
