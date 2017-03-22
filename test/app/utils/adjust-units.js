/* globals d3:false */

let multipliers = {
  K : 1000, // eslint-disable-line no-magic-numbers
  k : 1000, // eslint-disable-line no-magic-numbers
  M : 1000000, // eslint-disable-line no-magic-numbers
  G : 1000000000 // eslint-disable-line no-magic-numbers
};

export default function adjustUnits(value, unit, precision = 2) { // eslint-disable-line no-magic-numbers
  let mul = 1;
  let realUnit = unit;

  if (unit && multipliers[unit[0]]) {
    mul = multipliers[unit[0]];
    realUnit = unit.substr(1);
  }

  return d3.format(`.${precision}s`)(value * mul) + realUnit;
}
