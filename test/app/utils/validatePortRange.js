import { PORT_RANGE } from '../constants';

function validatePortRange(port) {
  port = Number(port);
  return (port >= PORT_RANGE[0])
    && (port <= PORT_RANGE[1]);
}

export default validatePortRange;
