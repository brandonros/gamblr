var cron = require('cron');

var processBets = require('./processBets.js');

new cron.CronJob({
  cronTime: '*/5 * * * *',
  onTick: function() {
    processBets();
  },
  start: true,
  timeZone: 'America/New_York'
});

console.log(new Date(), 'Initiated...');