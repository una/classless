import SlideOutDropdownMenu from '../components/slide-out-dropdown-menu';
import {SNAPSHOT_COST_PER_GB} from '../constants';

export default SlideOutDropdownMenu.extend({
  PRICE_PER_GB: SNAPSHOT_COST_PER_GB,
  actions: {
    createSnapshot: function () {
      let volume = this.get('actionParams');
      this.set('isTakingSnapshot', true);
      volume.onSnapshotComplete = (success) => {
        if(success) {
          this.clickAway();
          if(this.get('incrementCount')){
            this.sendAction('incrementCount', 'volumeSnapshotCount');
          }
        }
        this.set('isTakingSnapshot', false);
      };
      this.sendAction('createSnapshot', volume);
    },
    onSubmit: function () {
      this.set('submittedSuccess', true);
      if(this.get('isOpen')){
        this.set('isOpen', false);
      }
    },
    showIncreaseModal: function () {
      this.set('showResourceLimitForm', true);
    }
  }
});
