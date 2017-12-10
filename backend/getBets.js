var rp = require('request-promise');
var cheerio = require('cheerio');
var moment = require('moment');

module.exports = async function() {
  var options = {
      uri: 'https://sports.bovada.lv/football/nfl',
      transform: function (body) {
          return cheerio.load(body);
      }
  };

  console.log(new Date(), 'Getting  bets...');

  var $ = await rp(options);

  var scripts = $('script');

  var matchingScriptHtml = scripts.toArray().map(function(script) {
    return $(script).html();
  }).find(function(html) {
    return html.indexOf('swc_market_lists') !== -1;
  });

  if (!matchingScriptHtml) {
    throw new Error('Script not found');
  }

  var games = JSON.parse(matchingScriptHtml.replace('var swc_market_lists = ', '')).items[0].itemList.items;

  var bets = [];

  games.forEach(function(game) {
    game.displayGroups[0].itemList.forEach(function(bet) {
      bet.outcomes.forEach(function(outcome) {
        bets.push({
          game: game.description,
          startTime: moment.unix(game.startTime / 1000).format(),
          bet: bet.description,
          outcome: outcome.description,
          handicap: outcome.price.handicap,
          price: outcome.price.american
        });
      });
    });
  });

  return bets;
};
