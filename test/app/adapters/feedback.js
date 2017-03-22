import BuildUrlWithParent from '../mixins/build-url-with-parent';
import LifeboatAdapter from '../adapters/lifeboat';

export default LifeboatAdapter.extend(BuildUrlWithParent, {
  parentType: 'reply'
});