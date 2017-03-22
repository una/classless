/* globals d3:false */
import Ember from 'ember';

const TOOLTIP_ENTRY_TPL = `<span class="unit u-floatRight u-ml-1"></span>
  <span class="value u-floatRight"></span>
  <span class="color-bullet"></span>
  <span class="droplet-name"></span>`;

const TOOLTIP_HEADER_TPL = `<span class="date"></span>
  <span class="time"></span>`;

const EMPTY_TOOLTIP_TEXT = 'Hover over chart to see values';


let formatDate = d3.time.format('%m-%e-%Y');
let formatTime = d3.time.format('%I:%M %p');

function genTooltipItem(i) {
  return function() {
    let d = document.createElement('div');
    d.className = `item item-${i}`;
    d.innerHTML = TOOLTIP_ENTRY_TPL;
    return d;
  };
}

let yTickFormat = d3.format(".2f");

export default Ember.Mixin.create({

  setupTooltip: function() {
    let $me = this.$('.aurora-droplet-graph');

    // Tooltip
    let tooltip = d3.select($me.get(0))
      .append('div');

    tooltip.append(function() {
      let header = document.createElement('p');
      header.className = 'header small-dark';
      header.innerHTML = TOOLTIP_HEADER_TPL;
      return header;
    });

    tooltip.append(function() {
      let empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerText = EMPTY_TOOLTIP_TEXT;
      return empty;
    });

    tooltip
      .attr('class', 'chart-tooltip empty');

    this.set('tooltip', tooltip);

  }.on('didInsertElement'),

  updateTooltip: function() {
    let linesData = this.get('linesData');
    let tooltip = this.get('tooltip');
    if (!linesData || !tooltip) {
      return;
    }

    tooltip.selectAll('div.item').remove();

    linesData.forEach((d, i) => {
      tooltip.append(genTooltipItem(i));
    });

  }.observes('linesData'),

  tooltipVisibility: function() {
    let tooltip = this.get('tooltip');

    if (this.get('isFocused')) {
      tooltip.attr('class', 'chart-tooltip');
    } else {
      tooltip.attr('class', 'chart-tooltip empty');
    }
  }.observes('isFocused'),

  tooltipHandleMouseMove: function() {
    let tooltip = this.get('tooltip');
    let linesData = this.get('linesData');
    let linesMeta = this.get('linesMeta');
    let d = this.get('focusedDate');
    let v = this.get('focusedValues');

    tooltip.select('.header .date').text(formatDate(d));
    tooltip.select('.header .time').text(formatTime(d));

    linesData.forEach((ds, j) => {
      if (v) {
        tooltip.select(`.item-${j} .value`).text(`${yTickFormat(v[j].value)}`);
      }
      tooltip.select(`.item-${j} .droplet-name`).text(`${linesMeta[j].name}`);
      tooltip.select(`.item-${j} .unit`).text(`${linesMeta[j].unit}`);
      tooltip.select(`.item-${j} .color-bullet`).style('background-color', this.get('palette')[j]);
    });
  }.on('mousemove')

});
