import Ember from 'ember';

export default Ember.Component.extend({

  attributeBindings: ['data-placement', 'data-toggle', 'title', 'data-trigger', 'data-container', 'data-template'],
  classNames: ['tooltip-wrap', 'popover', 'remaining-droplet-tags'],
  classNameBindings: ['isDisabled', 'multiline', 'overflow'],

  'data-toggle': 'tooltip',
  'data-placement': 'top',
  'data-trigger': 'manual',
  'data-container': '.aurora-body',
  'data-template': function() {
    let viewId = this.get('elementId');
    return `<div class="Tooltip fade Tooltip--top in remaining-droplet-tags-tooltip js-tooltip-${viewId}"><div class="Tooltip-arrow"></div><div class="Tooltip-inner"></div></div>`;
  }.property('elementId'),

  boundClick: null,
  isClosed: Ember.computed.empty('tooltipEl'),
  tooltipEl: null,

  body: function() {
    return Ember.$(document.body);
  }.property(),

  teardown: function () {
    this._hide();
    this.$().tooltip('destroy');
  }.on('willDestroyElement'),

  _hide: function() {
    let $el = this.$();
    if ($el && $el.tooltip) {
      $el.tooltip('hide');
      let listener = this.get('boundClick');
      if(listener) {
        this.get('body').off('click', listener);
      }
      this.set('boundClick', null);
      this.set('tooltipEl', null);
    }
  },

  _show: function() {
    this.$().tooltip('show');
    this.set('tooltipEl', Ember.$(`.js-tooltip-${this.get('elementId')}`));
    this.set('boundClick', this.listenForClick.bind(this));
    this.get('body').on('click', this.get('boundClick'));
  },

  click: function() {
    if (this.get('isClosed')) {
      this._show();
    } else {
      this._hide();
    }
  },

  listenForClick: function(e) {
    let $tooltip = this.get('tooltipEl');
    let $el = this.$();
    let emberView = $el && $el[0];
    let isButton = emberView && (e.target === emberView || Ember.$.contains(emberView, e.target));
    let isTooltip = $tooltip && $tooltip[0] && (e.target === $tooltip[0] || Ember.$.contains($tooltip[0], e.target));
    if (!isButton && !isTooltip) {
      this._hide();
    }
  },

  setup: function() {
    Ember.run.scheduleOnce('afterRender', this, () => {
      this.set('multiline', true);
      this.$().attr('data-html', true);
      this.updateContent();
    });
  }.on('willInsertElement'),

  updateContent: function() {
    let html = this.$('.js-popover-content').html();
    this.$().attr('data-original-title', html);
    this.$().tooltip('setContent');
  },

  updateOnChange: function() {
    this.setup();
    this.rerender();
  }.observes('tags'),

  actions: {
    tagClick: function(tag) {
      this.sendAction('tagClick', tag);
    }
  }
});
