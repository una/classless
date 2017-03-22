import ClickToCopy from './click-to-copy';
import {PropTypes} from 'ember-prop-types';

/**
  Just allowing the click-to-copy with elements that are more complex than
  pure text
  Example Usage:

  ```
  {{#copy-on-content-click
    text="Thing that will be copied"}}
    <p>Content that will be shown</p>
  {{/copy-on-content-click}}
  ```
 */
export default ClickToCopy.extend({
  propTypes: {
    text: PropTypes.string.isRequired
  }
});