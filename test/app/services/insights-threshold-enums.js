/* eslint-disable no-multi-spaces */
import Ember from 'ember';

let inflector = new Ember.Inflector(Ember.Inflector.defaultRules);

let Duration = Ember.Object.extend({
  id: '', // select box is easier to implement when there is a unique id on an object
  unit: '',
  value: 0,

  humanReadableName: function() {
    if (this.get('value') === 0) {
      return 'Immediately';
    }
    let unit = this.get('value') > 1 && ['hour', 'day'].indexOf(this.get('unit')) !== -1 ?
      inflector.pluralize(this.get('unit')) :
      this.get('unit');
    return `${this.get('value')} ${unit}`;
  }.property('value', 'unit')
});

let metrics = [
  {
    name: 'CPU',
    machineName: 'CPU_TOTAL',
    type: 'static',
    unit: '%',
    statisticsEndpoint: 'cpu',
    statisticsFilter: null,
    radarEndpoint: 'sonar_cpu'
  },
  {
    name: 'Bandwidth — Inbound',
    machineName: 'PUBLIC_INBOUND',
    type: 'static',
    unit: 'Mbps',
    statisticsEndpoint: 'bandwidth',
    statisticsFilter: 'public_inbound',
    radarEndpoint: 'sonar_network_receive_bytes'
  },
  {
    name: 'Bandwidth — Outbound',
    machineName: 'PUBLIC_OUTBOUND',
    type: 'static',
    unit: 'Mbps',
    statisticsEndpoint: 'bandwidth',
    statisticsFilter: 'public_outbound',
    radarEndpoint: 'sonar_network_transmit_bytes'
  },
  {
    name: 'Disk — Read',
    machineName: 'DISK_READ',
    type: 'static',
    unit: 'MB/s',
    statisticsEndpoint: 'disk',
    statisticsFilter: 'read',
    radarEndpoint: 'sonar_disk_bytes_read'
  },
  {
    name: 'Disk — Write',
    machineName: 'DISK_WRITE',
    type: 'static',
    unit: 'MB/s',
    statisticsEndpoint: 'disk',
    statisticsFilter: 'write',
    radarEndpoint: 'sonar_disk_bytes_written'
  },
  {
    name: 'Memory Utilization',
    machineName: 'MEMORY_UTILIZATION',
    type: 'static',
    unit: '%',
    statisticsEndpoint: 'sonar_memory_memtotal',
    statisticsFilter: 'normalizeTimeSeriesData',
    radarEndpoint: 'sonar_memory_memtotal'
  },
  {
    name: 'Disk Utilization',
    machineName: 'DISK_UTILIZATION',
    type: 'static',
    unit: '%',
    statisticsEndpoint: 'sonar_disk_space',
    statisticsFilter: 'normalizeTimeSeriesData',
    radarEndpoint: 'sonar_disk_space'
  }
];

export default Ember.Service.extend({

  metrics: metrics.map(m => Ember.Object.create(m)),

  durations: [
    Duration.create({id: '3', unit: 'min',  value: 5,  machineName: 'MINUTES' }),
    Duration.create({id: '4', unit: 'min',  value: 10, machineName: 'MINUTES'}),
    Duration.create({id: '5', unit: 'min',  value: 30, machineName: 'MINUTES'}),
    Duration.create({id: '6', unit: 'hour', value: 1,  machineName: 'HOURS' }),
    Duration.create({id: '7', unit: 'hour', value: 6,  machineName: 'HOURS' }),
    Duration.create({id: '8', unit: 'day',  value: 1,  machineName: 'DAYS' })
  ],

  conditions: [
    {machineName: 'ABOVE', name: 'is above'},
    {machineName: 'BELOW', name: 'is below'}
  ],

  endpoints: Ember.ArrayProxy.create({ content: Ember.A([
    Ember.Object.create({name: 'phone', uriPrefix: 'sms'}),
    Ember.Object.create({name: 'email', uriPrefix: 'mailto'}),
    Ember.Object.create({name: 'slack', uriPrefix: 'slack'})
  ]) })
});
