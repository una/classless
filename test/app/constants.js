/**
 * Application globals
 */

export const RADIX = 10;

export const DEBOUNCE_AMOUNT = 250;

export const SNAPSHOT_COST_PER_GB = 0.05;

/* PROGRESS */
export const MAX_PROGRESS = 100;
export const ALMOST_DONE_PROGRESS = 99;

/* MEMORY */
export const BYTES_IN_KB = 1024;

/* PRECISION */
export const COST_PER_HOUR_PRECISION = 3;

/* CURRENCY */
export const CURRENCY_USD_PRECISION = 2;

/* TIME */
export const MS_IN_SECONDS = 1000;
export const MS_IN_ONE_MINUTE = 60000;
export const MS_IN_SIX_MINUTES = 360000;
export const MS_IN_ONE_HOUR = 3600000;

/* STATUS CODES */
export const STATUS_CODE_OK = 200;
export const STATUS_CODE_UNAUTHORIZED = 401;
export const STATUS_CODE_FORBIDDEN = 403;
export const STATUS_CODE_NOT_FOUND = 404;
export const STATUS_CODE_ERROR = 500;

/* CONSOLE WINDOW */
export const CONSOLE_WINDOW_WIDTH = 1034;
export const CONSOLE_WINDOW_HEIGHT = 818;

/* LOCALSTORAGE KEYS */
export const INSIGHTS_DASHBOARD_COLOR_THEME_KEY = 'insights-dashboard-color-theme';
export const INSIGHTS_NOTIFICATION_SLACK_WEBHOOK_INFO = 'insights-notification-slack-webhook-info';

/* CHARTS */
export const MAX_PERCENTS = 100;
export const ONE_THIRD = 0.33;
export const TWO_THIRDS = 0.66;
export const METRICS_PRECISION = 2;
export const MILLION_MULTIPLIER = 1e6;

/* KEY CODES */
export const BACKSPACE_KEY = 8;
export const TAB_KEY = 9;
export const ENTER_KEY = 13;
export const ESC_KEY = 27;
export const SPACE_BAR = 32;
export const LEFT_ARROW = 37;
export const UP_ARROW = 38;
export const RIGHT_ARROW = 39;
export const DOWN_ARROW = 40;
export const DELETE_KEY = 46;
export const LETTER_KEY_A = 65;
export const COMMA_KEY = 188;

/* REQUEST TRACING */
export const REQUEST_HEADER_NAME = 'X-Request-Id';

/* CONTEXT SWITCHING */

export const CONTEXT_ID_SUBSTRING_LENGTH = 6;
export const CONTEXT_ID_HEADER_NAME = 'X-Context-Id';

export const PORT_RANGE = [1, 65535]; // eslint-disable-line no-magic-numbers

/* DOMAINS */

export const DEFAULT_TTL = 3600;

/* REGEXES */

// Allows alphanumeric characters, dashes, and periods
// IMPORTANT: This pattern needs to be surrounded by quotes, not slashes,
// since it gets passed in to templates as an HTML `pattern` attribute, which
// requires a quoted string.
export const VALID_NAME_REGEX = '^[a-zA-Z0-9]?[a-z0-9A-Z\.\-]*[a-z0-9A-Z\.]$';

/* PORTS */
export const HTTP_PORT = 80;
export const HTTPS_PORT = 443;

/* LOAD BALANCERS */
export const METRIC_UNAVAILABLE = 'METRIC_UNAVAILABLE';
export const COLLECTING_METRICS = 'COLLECTING_METRICS';
export const METRIC_LOADING = 'METRIC_LOADING';
export const COLLECTING_METRICS_TOOLTIP_TEXT = 'Metrics for this Load Balancer will be available shortly.';
export const COLLECTING_DROPLET_METRICS_TOOLTIP_TEXT = 'Droplet metrics for this Load Balancer will be available shortly.';
export const TLS_PASSTHROUGH_VALUE = 'tls passthrough';
export const ADD_CERTIFICATE_VALUE = 'add certificate';

export const LB_DROPLET_STATUSES = {
  up: {
    label: 'Healthy',
    iconClass: 'lb-status-healthy'
  },
  collectingMetrics: {
    label: 'Collecting...',
    iconClass: 'lb-status-healthy',
    tooltipText: COLLECTING_DROPLET_METRICS_TOOLTIP_TEXT
  },
  down: {
    label: 'Down',
    iconClass: 'lb-status-down',
    rowClass: 'lb-droplet-down'
  }
};

/* Harcoded network interfaces names (temporarily, agent will be responsible for classifying them) */
export const PRIV_NETWORK_INTERFACE_NAMES = ['eth1', 'ens4'];
export const MAX_FIREWALL_DROPLETS = 10;
export const MAX_FIREWALL_TAGS = 5;
export const MAX_FIREWALL_RULES = 50;
export const MIME_TYPES = {
  application: ['octet-stream', 'msword', 'javascript', 'json', 'ogg', 'pdf', 'xml', 'zip', 'x-shockwave-flash'],
  image: ['jpg', 'jpeg', 'svg+xml', 'tiff', 'png', 'webp', 'gif', 'bmp', 'x-icon'],
  font: ['ttf', 'woff', 'woff2', 'otf', 'collection'],
  audio: ['x-wav', 'aac', 'webm', 'ogg', 'midi'],
  text: ['html', 'plain', 'calendar', 'css', 'csv', 'rtf'],
  video: ['webm', 'ogg', 'mpeg', 'H264']
};
