import Ember from 'ember';
import DomainRecordRow from '../components/domain-record-row';

export default Ember.Component.extend({
  classNameBindings: ['className'],
  classNames: ['editable-cell'],
  actions: {
    onSelectItem: function (item) {
      let domainRecordRow = this.get('parentView');
      while(domainRecordRow && !(domainRecordRow instanceof DomainRecordRow)) {
        domainRecordRow = domainRecordRow.get('parentView');
      }
      if(domainRecordRow) {
        domainRecordRow.send('onSelectItem', item);
      }
    }
  }
});
