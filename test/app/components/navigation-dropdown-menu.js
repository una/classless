import DropdownMenu from '../components/dropdown-menu';
import Ember from 'ember';
import {DEBOUNCE_AMOUNT} from '../constants';

// Chosen for relative height to most browsers, but also for truncating a context list
// item in half. If updating, keep in mind that we should be setting the height at
// a context list item midpoint in order to imply scrolling.
const MAX_HEIGHT = 310;
const MIN_HEIGHT = 130;

export default DropdownMenu.extend({
  onInit: function () {
    this.classNames = (this.classNames || []).concat(['navigation-dropdown-menu', 'account-dropdown', 'teams-dropdown']);

    // Resize dropdown on window resize
    Ember.$(window).resize(() => {
      Ember.run.debounce(this, this._resizeHandler, DEBOUNCE_AMOUNT);
    });

    Ember.run.scheduleOnce('afterRender', this._resizeHandler.bind(this));
  }.on('init'),

  _resizeHandler: function () {
    if (!this.get('isOpen')) {
      return;
    }
    let $contextList = this.$('.context-list');
    let contextsFullHeight = $contextList.find('section')[0].scrollHeight;
    let windowHeight = Ember.$(window).height();
    let dropdownHeightWithoutContexts = this.$('.menu-dropdown').height() - $contextList.height();
    let navBarHeight = Ember.$('.nav_controls').height();
    let allowableHeight = windowHeight - (dropdownHeightWithoutContexts + navBarHeight);
    // Determine the updatedHeight by finding the value within MAX and MIN values
    let updatedHeight = allowableHeight < MAX_HEIGHT ? allowableHeight : MAX_HEIGHT;
    updatedHeight = updatedHeight < MIN_HEIGHT ? MIN_HEIGHT : updatedHeight;
    // Update only if the height has changed
    if (updatedHeight !== $contextList.height()) {
      if (contextsFullHeight < updatedHeight) {
        $contextList.removeClass('context-list-overflow');
      } else {
        $contextList.addClass('context-list-overflow');
      }
      this.$('.context-list').css('max-height', updatedHeight + 'px');
    }
  }.observes('isOpen', 'model.organizations'),

  actions: {
    switchContext: function(contextId) {
      this.sendAction('switchContext', contextId);
    }
  }
});
