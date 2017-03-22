/* globals c3:false */
export default {
  name: 'c3Init',
  initialize: function() {
    /**
     * Updates the C3 chart internal config for formatting the y axis.
     *
     * @param {Function} formatFn A function which takes a value and returns a formatted string.
     * @extends {c3.chart.fn}
     */
    c3.chart.fn.setAxisYTickFormat = function(formatFn) {
      this.internal.config.axis_y_tick_format = formatFn;
    };
  }
};
