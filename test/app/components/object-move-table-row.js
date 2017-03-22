import Ember from 'ember';
import {PropTypes} from 'ember-prop-types';

const TD_PAD = 15;
const LEVEL_PAD = 39;

export default Ember.Component.extend({
  propTypes: {
    dir: PropTypes.object.isRequired
  },
  tagName: '',
  classNames: '',
  parentKey: '',

  filteredDir: Ember.computed('dir', function () {
    let origDir = this.get('dir');
    let dir = Ember.Object.create(origDir);
    let key = this.get('parentKey') + dir.get('name') + '/';
    let currentDir = this.get('currentDir');

    origDir.invalid = key === currentDir;

    dir.setProperties({
      invalid: origDir.invalid,
      key: key
    });

    return dir;
  }),

  myId: Ember.computed(function () {
    return 'move-' + Ember.guidFor(this);
  }),

  init() {
    Ember.run.scheduleOnce('afterRender', this, () => {
      Ember.$('#' + this.get('myId')).find('td').first().css('padding-left', (TD_PAD + (this.get('depth') * LEVEL_PAD)) + 'px');
    });

    this._super(...arguments);
  },

  actions: {
    onToggleDirTree(dir) {
      if(this.get('onToggleDirTree')) {
        this.sendAction('onToggleDirTree', dir);
      }
    },
    onToggleSelectFolder(dir) {
      if(!dir.invalid && this.get('onToggleSelectFolder')) {
        this.sendAction('onToggleSelectFolder', dir);
      }
    }
  }
});
