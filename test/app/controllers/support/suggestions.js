import Ember from 'ember';
import _ from 'lodash/lodash';
import handleEmberLink from '../../utils/handle-ember-link';
import getInitalSuggestionFromPageContext from '../../utils/get-initial-suggestion-from-page-context';

const DEBOUNCE_AMOUNT = 300;
const STICKY_BOTTOM_OFFSET = 100;

export default Ember.Controller.extend({

  queryParams: ['query', 'article', 'page'],
  defaultQuery: getInitalSuggestionFromPageContext(),

  onInit: function() {
    this.setProperties({
      'articles': [],
      'curPage': 0,
      'lastPageLoaded': null,
      'firstPageLoaded': null,
      'pageSize': 5,
      'hasData': false,
      'loadedInitialArticle': false,
      'loadedInitialPage': false
    });

    // The queryParams won't be set yet in 'init', so we to delay our first query so we
    // dont make a needless XHR
    this.makeDefaultQuery();

    this.scrollFn = this.onScroll.bind(this);
    this.resizeFn = this.onResize.bind(this);

    this.$win = Ember.$(window);
    this.$win.on('scroll', this.scrollFn);
    this.$win.on('resize', this.resizeFn);
    this.$win.on('click', this.onClick);
  }.on('init'),

  makeDefaultQuery: function () {
    Ember.run.next(() => {
      // queryDidChange will not fire if query is undefined on init, so we need to make the first query
      if(_.isUndefined(this.get('query')) && !(this.get('isDestroyed') || this.get('isDestroying'))) {
        this.set('curPage', 0);
        this.doQuery(this.get('defaultQuery'), true);
      }
    });
  },

  unSelectArticle: function() {
    let oldArticle = this.get('currentArticle');
    if (oldArticle) {
      oldArticle.set('selected', false);
    }
  },

  selectArticle: function() {
    this.unSelectArticle();
    let article;
    let articles = this.get('articles');
    let articleId = this.get('article');
    if (_.isObject(articles) && articles.get('length') > 0) {
      if (_.isString(articleId)) {
        article = articles.findBy('id', articleId);
      } else {
        article = articles.objectAtContent(0);
        if (article.id) {
          this.set('article', article.id);
          this.set('loadedInitialArticle', true);
        }
        return;
      }
      if (!_.isUndefined(article) && article.id) {
        article.set('selected', true);
        if (_.isNumber(article.get('page'))) {
          this.set('page', article.get('page'));
          this.set('loadedInitialPage', true);
        }
      } else {
        this.queryDidChange();
        return;
      }
      this.set('currentArticle', article);
      Ember.run.next(this.setupStickyCols.bind(this));
    }
  }.observes('article', 'articles'),

  setPageNum: function (data, page) {
    data.forEach(function(model) {
      model.set('page', page);
    });
  },

  doQuery: function (query, resetArticles, shiftModels) {
    this.set('loading', true);
    let page = this.get('curPage');
    if (!_.isUndefined(this.get('page')) && !this.get('loadedInitialPage')) {
      page = parseInt(this.get('page'), 10);
      this.set('loadedInitialPage', true);
    }

    this.store.query('article', { q: query, page: page }).then((data) => {
      this.setProperties({
        'loading': false,
        'pageSize': data.get('meta.perPage'),
        'lastPage': data.get('meta.pages'),
        'currentQuery': query,
        'hasData': true,
        'curPage': page
      });
      let articleList = this.get('articles');
      if (resetArticles) {
        if (data) {
          this.setPageNum(data, page);
        }
        this.set('articles', data);
        let articleToSelect = data.get('length') ? data.objectAtContent(0) : null;
        if (!this.get('loadedInitialArticle') && this.get('article')) {
          let specifiedArticle = data.findBy('id', this.get('article'));

          if (specifiedArticle && specifiedArticle.id) {
            articleToSelect = specifiedArticle;
          }
        }
        this.set('firstPageLoaded', page);
        this.set('lastPageLoaded', page);
        this.set('article', articleToSelect.id);
        this.set('loadedInitialArticle', true);
        this.set('page', page);
        this.set('loadedInitialPage', true);
      } else {
        if(data && data.content) {
          this.setPageNum(data, page);
          if (shiftModels) {
            this.set('firstPageLoaded', page);
            this.set('articles', data.pushObjects(articleList.content));
          } else {
            this.set('lastPageLoaded', page);
            articleList.pushObjects(data.content);
          }
        }
      }
    }, () => {
      this.setProperties({
        'loading': false,
        'pageSize': 1,
        'lastPage': 1,
        'currentQuery': query,
        'articles': [],
        'hasData': true,
        'curPage': -1
      });
      this.set('article', null);
    });
  },

  queryDidChangeDebounced: function() {
    if (this.get('isDestroyed') || this.get('isDestroying')) {
      return;
    }
    let query = this.get('query') || '';
    let defaultQuery = this.get('defaultQuery');

    // If we are on the default query, it won't appear as a query parameter
    if (query === '' && defaultQuery === this.get('currentQuery')) {
      return;
    }
    if(!query.trim()) {
      query = defaultQuery;
    }

    if(this.segment) {
      this.segment.trackEvent('Lifeboat search', { query: query });
    }

    this.set('curPage', 0);
    this.doQuery(query, true);
  },

  queryDidChange: function () {
    Ember.run.debounce(this, this.queryDidChangeDebounced, DEBOUNCE_AMOUNT);
  }.observes('query'),

  noResultsFound: function () {
    return this.get('hasData') && !this.get('articles').length;
  }.property('articles.[]'),

  hasMorePages: function () {
    if (this.get('lastPage')) {
      return this.get('lastPage') > this.get('lastPageLoaded') + 1;
    }
    return false;
  }.property('articles', 'curPage', 'lastPage', 'lastPageLoaded'),

  hasPrevPages: function () {
    return this.get('firstPageLoaded') > 0;
  }.property('articles', 'curPage', 'firstPageLoaded'),


  actions: {
    makeSuggestion: function (query) {
      this.set('query', query);
    },
    viewArticle: function (article) {
      this.set('loadedInitialArticle', true);
      this.set('article', article.id);
    },
    nextPage: function () {
      this.set('curPage', this.get('lastPageLoaded') + 1);
      this.doQuery(this.get('currentQuery'), false, false);
    },
    prevPage: function () {
      this.set('curPage', this.get('firstPageLoaded') - 1);
      this.doQuery(this.get('currentQuery'), false, true);
    }
  },

  stickyMargin: 30,

  onScroll: function(dontUpdateOverflowOffset) {
    if(!this.$stickyCol || 'ontouchstart' in window) {
      return;
    }

    let scrollPos = window.pageYOffset;
    let shouldBeFixed = scrollPos >= this.stickyBreakPoint;
    let node;

    if(shouldBeFixed !== this.isFixed) {
      node = this.$stickyCol[0];
      node.style.position = shouldBeFixed ? 'fixed' : 'absolute';
      node.style.top = shouldBeFixed ? this.stickyTop + 'px': '';
      if(dontUpdateOverflowOffset !== true) {
        this.overflowOffset = 0;
      }
      this.isFixed = shouldBeFixed;
    }

    if(this.isFixed && this.overflow) {
      node = node || this.$stickyCol[0];
      let offset = this.overflowOffset + scrollPos - this.lastScrollPos;
      this.overflowOffset = scrollPos >= this.lastScrollPos ? Math.min(this.overflow, offset) : Math.max(0, offset);

      node.style.top = this.stickyTop - this.overflowOffset + 'px';
    }

    this.lastScrollPos = scrollPos;
  },

  onResize: function () {
    this.handleChange();
    this.isFixed = false;
    this.onScroll();
  },

  onHide: function () {
    this.$win.off('scroll', this.scrollFn);
    this.$win.off('resize', this.resizeFn);
    this.$columns.css({
      position: '',
      transform: '',
      top: ''
    });
  }.on('willDestroy'),

  onClick: function (e) {
    handleEmberLink(e);
  },

  reSetupStickyCols: function () {
    let $cols = Ember.$('.suggestion-column');
    if ($cols.length === 0) {
      return;
    }
    let dimensions = $cols[0].getBoundingClientRect();
    let stickyEl = document.querySelector('.nav-bar');
    let stickyElBottom = stickyEl ? stickyEl.getBoundingClientRect().bottom - STICKY_BOTTOM_OFFSET : 0;
    let firstColWidth = window.getComputedStyle($cols[0]).width;

    $cols.eq(0).css('width', firstColWidth);
    $cols.eq(1).css({
      width: window.getComputedStyle($cols[1]).width,
      marginLeft: firstColWidth
    });
    $cols.css({
      position: 'absolute',
      transform: 'translateZ(0)'
    });
    this.$columns = $cols;

    this.stickyBreakPoint = dimensions.top - stickyElBottom - this.stickyMargin;
    this.stickyTop = stickyElBottom + window.pageYOffset + this.stickyMargin;

    this.onChange();
  },

  setupStickyCols: _.once(function() {
    this.reSetupStickyCols();
  }),

  handleChange: function() {
    if (!this.$stickyCol || !this.$stickyCol.length) {
      return;
    }
    let dimensions = this.$stickyCol[0].getBoundingClientRect();

    this.lastScrollPos = window.pageYOffset;
    this.windowHeight = window.innerHeight;

    //The number of pixels that the shorter overflows the viewport vertically
    this.overflow = Math.max(0, dimensions.bottom - dimensions.top + this.stickyMargin + this.stickyTop - this.windowHeight);
  },

  onChange: function (viaPagination, imagesLoaded) {
    viaPagination = viaPagination === true;
    imagesLoaded = imagesLoaded === true;

    if (!this.$columns) { return; }
    let $shorter = this.$columns.eq(0);
    let $taller = this.$columns.eq(1);
    if($shorter.height() > $taller.height()) {
      $taller = $shorter;
      $shorter = this.$columns.eq(1);
    }
    if(!this.$stickyCol || $shorter[0] !== this.$stickyCol[0]) {
      this.$stickyCol = $shorter;
      this.$columns.css({
        position: 'absolute',
        top: ''
      });
    }

    this.handleChange();

    if(!viaPagination) {
      if(!imagesLoaded) {
        //force next scroll event to update state
        this.isFixed = null;
        this.overflowOffset = 0;
        window.scrollTo(0, this.lastScrollPos > this.stickyBreakPoint ? this.stickyBreakPoint : this.lastScrollPos);

        let imgs = this.$columns.find('img');
        let len = imgs.length;
        imgs.on('load', () => {
          if(! --len) {
            this.onChange(viaPagination, true);
            imgs.off('load');
          }
        });
      }
    } else if($shorter[0] === this.$columns[0] && this.isFixed) {
      this.overflowOffset = this.overflow;
      this.onScroll(true);
    } else if($shorter[0] === this.$columns[1] && this.isFixed) {
      this.overflowOffset = this.lastScrollPos - this.stickyBreakPoint;
      this.isFixed = null;
      this.onScroll(true);
    }
  },

  contentChange: function() {
    Ember.run.next(this.onChange.bind(this));
  }.observes('currentArticle', 'article', 'articles.length'),

  pageChange: function() {
    this.onChange(true);
  }.observes('curPage')
});
