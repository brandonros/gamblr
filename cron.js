var cron = require('cron');

var run = require('./run.js');

new cron.CronJob({
  cronTime: '*/5 * * * *',
  onTick: function() {
    run();
  },
  start: true,
  timeZone: 'America/New_York'
});
