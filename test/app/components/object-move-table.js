import Ember from 'ember';
import { PropTypes } from 'ember-prop-types';
import { objectStorageFetch } from '../utils/apiHelpers';

export default Ember.Component.extend({
  propTypes: {
    onCloseMoveFiles: PropTypes.string,
    onSubmitMove: PropTypes.string,
    bucketName: PropTypes.string
  },
  tagName: 'div',
  classNames: 'objectMoveModal',
  dirsTree: [],

  filteredDirsTree: Ember.computed('dirsTree', 'currentDir', function () {
    return (this.get('dirsTree') || []).map(dir => Ember.Object.create(dir));
  }),

  init() {
    this.setProperties({
      movingDirsLoading: true
    });
    this.fetchDirTree().then((resp) => {
      this.set('dirsTree', resp.children);
    }).catch((err) => {
      return err;
    }).finally(() => {
      this.set('movingDirsLoading', false);
    });
    this._super(...arguments);
  },

  onToggleDirTree(dir) {
    if(dir.get('childrenOpen')) {
      dir.set('childrenOpen', false);
    } else {
      dir.set('childrenOpen', true);
    }
  },

  fetchDirTree(prefix) {
    let bucketName = this.get('bucketName');
    let url = `/buckets/${bucketName}/objects/dirs`;
    let params = {max_depth: 2};
    if(prefix) {
      params['prefix'] = prefix;
    }
    return objectStorageFetch(url, 'get', params, {});
  },

  fetchChildren(dir) {
    let objDir = this.findDirByKey({children: this.get('dirsTree')}, dir.get('key'));
    objDir.isLoadingChildren =  true;
    this.notifyPropertyChange('dirsTree');
    return this.fetchDirTree(dir.get('key')).then((resp) => {
      objDir.children = resp.children;
      return objDir.childrenOpen = true;
    }).finally(() => {
      objDir.isLoadingChildren = false;
      this.notifyPropertyChange('dirsTree');
    });
  },

  removeChildren(dir) {
    let objDir = this.findDirByKey({children: this.get('dirsTree')}, dir.get('key'));
    objDir.childrenOpen = false;
    this.notifyPropertyChange('dirsTree');
  },


  findDirByKey(root, key) {
    let q = [root];
    root.key = '';

    while (q.length > 0) {
      let dir = q.shift();

      if (dir.key === key) {
        return dir;
      }

      if (dir.children) {
        dir.children.forEach( (child) => {
          child.key = dir.key + child.name + '/';
          q.push(child);
        });
      }
    }
  },

  actions: {

    onConfirmMoveModalHide(save) {
      if(this.get('onCloseMoveFiles')) {
        this.sendAction('onCloseMoveFiles', this.get('selectedRow.key'), save);
      }
    },

    onToggleDirTree(dir) {
      if(dir.get('childrenOpen')) {
        this.removeChildren(dir);
      } else {
        this.fetchChildren(dir);
      }
    },

    onToggleSelectFolder(dir) {
      let objDir = this.findDirByKey({children: this.get('dirsTree')}, dir.get('key'));
      let selected = this.get('selectedRow');
      let selectObj;

      if(selected) {
        selectObj = this.findDirByKey({children: this.get('dirsTree')}, selected.get('key'));
        selectObj.selected = false;
        this.set('selectedRow', null);
      }

      if(objDir !== selectObj) {
        objDir.selected = true;
        this.set('selectedRow', dir);
      }

      this.notifyPropertyChange('dirsTree');
    }

  }
});
