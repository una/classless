import Ember from 'ember';

const DEFAULT_WINDOW_WIDTH = 1034,
      DEFAULT_WINDOW_HEIGHT = 818,
      DEFAULT_WINDOW_TOP_OFFSET = 0;

export default Ember.Service.extend({
  windowRef: null,

  show: function (url, w = DEFAULT_WINDOW_WIDTH, h = DEFAULT_WINDOW_HEIGHT, tOffset = DEFAULT_WINDOW_TOP_OFFSET, prefix = 'aurora-popup') {
    if (!url) {
      return;
    }

    if (this.get('multipleWindows') || this.get('windowRef') === null || this.get('windowRef').closed) {
      let screenWidth = screen.availWidth;
      let width = Math.min(w, screenWidth);
      let height = Math.min(h, screen.availHeight);
      let top = tOffset;
      let left = (screenWidth - width) / 2; // eslint-disable-line no-magic-numbers
      let winId = prefix + '-' + (new Date().getTime());

      this.set('windowRef', window.open(url, winId, `height=${height},width=${width},left=${left},top=${top}`));
    } else {
      this.get('windowRef').focus();
    }
  }
});
