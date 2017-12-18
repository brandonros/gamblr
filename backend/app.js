var cron = require('cron');

var processLines = require('./processLines.js');

new cron.CronJob({
  cronTime: '* * * * *',
  onTick: function() {
    processLines();
  },
  start: true,
  timeZone: 'America/New_York'
});

console.log(new Date(), 'Initiated...');
