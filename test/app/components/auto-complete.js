import Ember from 'ember';
import ValidationForm from '../components/form-with-validation';
import TypesHelper from '../utils/types';
import _ from 'lodash/lodash';
import {ENTER_KEY, ESC_KEY, DOWN_ARROW, UP_ARROW} from '../constants';

export default Ember.Component.extend({
  tagName: 'div',
  classNameBindings: ['isRequired', 'dontShowSelected'],
  classNames: 'aurora-auto-complete',
  lastScrollPos: 0,
  TRIGGER_SHOW_MORE: 200,
  HOVER_DELAY_AFTER_SCROLL: 300,
  SCROLL_MORE_THROTTLE: 500,

  sendScrollMoreAction: function () {
    this.sendAction('onShowMoreScroll', this.get('name'));
  },

  sendSelected: function () {
    if(this.get('onSelect')) {
      this.sendAction('onSelect', this.get('selectedItem'), this.get('name'));
      return true;
    }
  },

  sendInput: function (val, silent) {
    if(this.get('onInput')) {
      this.sendAction('onInput', val || '', this.get('name'), silent);
    }
  },

  handleInput: function (val) {
    this.sendInput(val);
    this.show();
  },

  handleDefaultSearchValue: function() {
    let searchValue = this.get('defaultSearchValue');
    if(searchValue) {
      this.set('searchValue', searchValue);
      this.set('doneDefaultSearch', false);

      Ember.run.next(() => {
        this.sendInput(searchValue);
      });
    }
  }.observes('defaultSearchValue'),

  onSetup: function () {
    let parentView = this.get('parentView');
    while(parentView && !(parentView instanceof ValidationForm)) {
      parentView = parentView.get('parentView');
    }
    this.validationForm = parentView;
  }.on('willInsertElement'),

  validateForm: function () {
    if(this.validationForm) {
      Ember.run.next(() => {
        this.validationForm.send('validateForm');
      });
    }
  },

  removePatternFromInput: function () {
    let $input = this.$('input');
    if($input.attr('pattern')) {
      $input.attr('data-pattern', $input.attr('pattern'));
      $input.removeAttr('pattern').removeAttr('required').removeClass('validateFail');
    }
  },

  addPatternToInput: function () {
    let $input = this.$('input');
    if($input.attr('data-pattern')) {
      $input.attr('pattern', $input.attr('data-pattern'));
      $input.removeAttr('data-pattern').attr('required', true);
    }
  },

  clear: function (reset) {
    let $input = this.$('input');
    if($input.val()) {
      this.set('isRefreshing', true);
      this.set('searchValue', '');
      $input.val('').closest('.FloatLabel').removeClass('is-active');
      this.sendInput('', reset);
    }
  },

  show: function (clear, reset) {
    let doClear = clear === true;
    let $this = this.$();

    if(!$this.hasClass('active')) {
      this.set('lastSelectedItem', clear ? null : this.get('selectedItem'));
      this.set('selectedItem', null);
      if(this.get('onShow')) {
        this.sendAction('onShow', !!clear, this.get('name'));
      }
      if(doClear) {
        this.clear(reset);
      }
      if(!reset) {
        Ember.run.next(() => {
          $this.addClass('active').find('input').focus();
        });
      }
      this.addPatternToInput();
      this.validateForm();
      return true;
    }
  },

  hide: function () {
    let $el = this.$();
    $el.removeClass('active');
    this.set('hoverIndex', -1);

    if(!this.get('selectedItem') && this.get('onHide')) {
      this.sendAction('onHide');
    }
  },

  select: function ($li) {
    if($li) {
      if(!$li.length) {
        return;
      }
      this.set('selectedItem', this.get('dropdownItems')[$li.closest('ul').find('li').index($li)]);
      if(this.get('dontShowSelected')) {
        this.$('input').val(this.get('selectedItem.name')).trigger('input');
      }
    }
    this.hide();
    this.removePatternFromInput();
    this.sendSelected();

    if (this.get('resetAfterSelect')) {
      this.set('selectedItem', null);
      this.clear();
    }

    this.validateForm();
  },

  scrollIntoView: function($li) {
    if($li.length) {
      let parent = $li.closest('ul')[0];
      let dims = $li[0].getBoundingClientRect();
      let parentDims = parent.getBoundingClientRect();
      let scrolled = false;
      if(dims.bottom > parentDims.bottom) {
        parent.scrollTop += dims.bottom - parentDims.bottom;
        scrolled = true;
      } else if(dims.top <= parentDims.top) {
        parent.scrollTop -= parentDims.top - dims.top;
        scrolled = true;
      }
      //prevent hover and keyboard events from colliding after scrolling the container
      if(scrolled) {
        this.ignoreHover = true;
        window.clearTimeout(this.scrollTimeout);
        this.scrollTimeout = window.setTimeout(() => {
          this.ignoreHover = false;
        }, this.HOVER_DELAY_AFTER_SCROLL);
      }
    }
  },

  //add event listeners
  setup: function () {
    let $this = this.$();
    let that = this;

    //click listeners
    $this.on('mousedown', 'li.item', (e) => {
      this.mousedownOnList = e.which === 1;
    }).on('click', (e) => {
      let clickedOnCloseButton = e.target.classList.contains('Resource-close');
      if(!this.show(clickedOnCloseButton)) { //if list is visible
        let $item = $this.find(e.target).closest('li.item');
        if($item.length) { // user clicked on a list item
          this.select($item);
        }
      }
      return false;
    });

    //keyboard navigation
    $this.on('keypress', 'input', (e) => {
      if($this.hasClass('active')) {
        if (e.keyCode === ENTER_KEY) { //enter
          let $hover = $this.find('li.hover');
          if($hover.length) {
            this.select($hover);
          }
          e.preventDefault();
        }
      }
    }).on('keyup', 'input', (e) => {
      if($this.hasClass('active')) {
        if(e.keyCode === DOWN_ARROW) { //down arrow
          let $cur = $this.find('li.item.hover').removeClass('hover');
          let $next = $cur.next('.item');
          if(!$cur.length) {
            $next = $cur = $this.find('li.item').first();
          }
          while($next.hasClass('disabled')) {
            $next = $next.next('.item');
          }

          if(!$next.length) {
            $this.find('li.item:not(.disabled)').last().addClass('hover');
            this.scrollIntoView($this.find('li:last-child'));
          } else {
            this.scrollIntoView($next.addClass('hover'));
          }
        } else if(e.keyCode === UP_ARROW) { //up arrow
          let $prev = $this.find('li.item.hover').removeClass('hover');

          while(($prev = $prev.prev('.item')).hasClass('disabled')) {} //eslint-disable-line no-empty

          if(!$prev.length) {
            $prev = $this.find('li.item').first();
          }
          this.scrollIntoView($prev.addClass('hover'));
        } else if(e.keyCode === ESC_KEY) { //escape
          this.hide();
          this.set('selectedItem', this.get('lastSelectedItem'));
          this.removePatternFromInput();
          this.validateForm();
          $this.find('input').blur();
          return false;
        }
      }
    });

    //hover events
    $this.on('mouseenter', 'li.item', function () {
      if(!that.ignoreHover) {
        $this.find(this).toggleClass('hover').siblings().removeClass('hover');
      }
    }).on('mouseleave', 'li.item', function () {
      $this.find(this).removeClass('hover');
    });

    //blur and focus
    $this.on('focus', 'input', this.show.bind(this));
    $this.on('blur', 'input', () => {
      if(!this.mousedownOnList) {
        this.hide();
      }
      this.mousedownOnList = false;
    });

    //infinite scroll
    if(this.get('onShowMoreScroll')) {
      $this.find('ul').on('scroll', function () {
        let scrollTop = this.scrollTop;
        let scrollHeight = this.scrollHeight;
        let clientHeight = this.clientHeight;
        if((scrollHeight - clientHeight - scrollTop) < that.TRIGGER_SHOW_MORE) {
          Ember.run.throttle(that, that.sendScrollMoreAction, that.SCROLL_MORE_THROTTLE);
        }
      });
    }
    //prevent the mousewheel from scrolling the page needlessly
    $this.find('ul').on('mousewheel DOMMouseScroll', function (e) {
      let delta = -e.originalEvent.wheelDelta || e.originalEvent.detail;
      let scrollHeight = this.scrollHeight;
      let clientHeight = this.clientHeight;
      let scrollTop = this.scrollTop;
      if(scrollHeight > clientHeight && ((delta < 0 && scrollTop === 0) || (delta > 0 && scrollHeight - clientHeight - scrollTop === 0))) {
        e.preventDefault();
      }
    });
    //custom events for cross component communication
    $this.on('resetForm', () => {
      this.show(true, true);
    });

    Ember.run.scheduleOnce('afterRender', this, 'afterModelChange');
    Ember.run.scheduleOnce('afterRender', this, 'handleDefaultSearchValue');
  }.on('didInsertElement'),

  triggerResetForm: function() {
    if(this.get('shouldResetForm')) {
      this.show(true, true);
    }
  }.observes('shouldResetForm'),

  //clean up event listeners
  teardown: function () {
    let $this = this.$();
    $this.off('click');
    $this.off('mouseenter mouseleave mousedown', 'li.item');
    $this.off('blur focus keypress keyup', 'input');
    $this.find('ul').off('scroll mousewheel DOMMouseScroll');
    $this.off('resetForm');
  }.on('willDestroyElement'),

  //scroll to the top after searching
  scrollToTop: function () {
    if(!this.get('isSearching')) {
      this.$().find('ul').scrollTop(0);
    }
    this.$().toggleClass('is-searching', this.get('isSearching'));
  }.observes('isSearching'),

  isSearchingSpinner: function () {
    return this.get('isSearching') && !this.get('isRefreshing');
  }.property('isSearching', 'isRefreshing'),

  showCloseButton: function () {
    let showClose = this.get('showClose');
    return showClose || _.isUndefined(showClose);
  }.property('showClose'),

  showList: function () {
    return !this.get('hideListUntilFirstSearch') || this.get('doneFirstInputSearch');
  }.property('hideListUntilFirstSearch', 'doneFirstInputSearch'),

  getItems: function () {
    let items = this.get('items') || [];
    if(!Array.isArray(items)) {
      items = items.toArray();
    }
    return items;
  },

  dropdownItems: function () {
    let items = this.getItems();

    let hasManyTypes = items.meta && items.meta.modelTypeCount > 1;
    let lastType;
    items = items.map((item) => {
      if(hasManyTypes) {
        let thisType = TypesHelper.getTypeStr(item);
        item.set('_ac_header', lastType !== thisType ? TypesHelper.getPluralizedTypeString(item) : null);
        lastType = thisType;
      } else {
        item.set('_ac_header', null);
      }
      return item;
    });

    let defaultItem = this.get('defaultItem');
    if(defaultItem) {
      items = [{
        name: defaultItem,
        selectedText: this.get('defaultItemSelectedText'),
        type: 'default',
        id: -1
      }].concat(items);
    }

    return items;
  }.property('items', 'defaultItem'),

  hasItems: function () {
    return this.get('dropdownItems').length || this.get('isShowingMore');
  }.property('items', 'defaultItem', 'isShowingMore'),

  autoCompleteDisabledItemIndicies: function () {
    let disabledItemIndicies = this.get('disabledItemIndicies');
    if(disabledItemIndicies && this.get('defaultItem')) {
      return disabledItemIndicies.map(function (index) {
        if(typeof index === 'number') {
          return index + 1;
        }
        index.index++;
        return index;
      });
    }
    return disabledItemIndicies;
  }.property('items', 'defaultItem', 'disabledItemIndicies'),

  afterModelChange: function () {
    //we're no longer refreshing if we have new items
    this.set('isRefreshing', false);

    //if there's a default search and only 1 item matches, select it
    if(this.get('defaultSearchValue') && !this.get('doneDefaultSearch')) {
      this.set('doneDefaultSearch', true);
      let items = this.getItems();
      if(items.length === 1) {
        this.set('selectedItem', items[0]);
        this.select();
      }
    } else if(this.get('hasInput')) {
      this.set('doneFirstInputSearch', true);
    }
    //before re-rendering the items, ensure items that are hovered look that way when re-rendered
    if(this.wasShowingMore) {
      let $hover = this.$().find('li.item.hover');
      if($hover.length) {
        let index = $hover.closest('ul').find('li.item').index($hover);
        return this.set('hoverIndex', index);
      }
    }
    this.set('hoverIndex', -1);
  }.observes('items'),

  ensureDefaultProps: function () {
    if(!this.get('isStatic')) {
      this.setProperties({
        name: this.get('name') || 'autoComplete',
        onShowMoreScroll: this.get('onShowMoreScroll') || '_ac_onShowMoreScroll',
        onInput: this.get('onInput') || '_ac_onInput'
      });
    }
    if(this.get('startOpen')) {
      Ember.run.scheduleOnce('render', this, 'show');
    }
  }.on('init'),

  setSelectedItem: function () {
    if(this.get('initialSelectedItem')) {
      this.set('selectedItem', this.get('initialSelectedItem'));
    }
  }.on('init'),

  cachePreviousRenderState: function () {
    this.wasShowingMore = this.get('isShowingMore');
  }.observes('isShowingMore', 'isSearching'),

  actions: {
    onInput: function(val) {
      this.set('hasInput', true);
      this.handleInput(val);
    }
  }
});
