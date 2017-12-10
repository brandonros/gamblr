var low = require('lowdb');
var FileSync = require('lowdb/adapters/FileSync');
var moment = require('moment');
var hash = require('object-hash');

var getBets = require('./getBets');

module.exports = async function() {
  var adapter = new FileSync('db.json');
  var db = low(adapter);

  db.defaults({ bets: [], priceChanges: [], handicapChanges: [] })
    .write();

  var bets = await getBets();

  bets.forEach(function(bet) {
    var betHash = hash({
      game: bet.game,
      startTime: bet.startTime,
      bet: bet.bet,
      outcome: bet.outcome
    });

    var dbBet = db.get('bets')
      .find({ id: betHash })
      .value();

    if (!dbBet) {
      console.log(new Date(), 'Inserting', betHash, bet);

      db.get('bets')
        .push(Object.assign({}, bet, { scraped: moment().format(), id: betHash }))
        .write();
    } else {
      if (dbBet.price !== bet.price) {
        console.log(new Date(), 'Updating price', betHash, dbBet, bet);

        db.get('priceChanges')
          .push({ betHash: betHash, oldPrice: dbBet.price, newPrice: bet.price, originallyScraped: dbBet.scraped, changed: moment().format() })
          .write();

        db.get('bets')
          .find({ id: betHash })
          .assign({ price: bet.price, scraped: moment().format() })
          .write();
      }

      if (dbBet.handicap !== bet.handicap) {
        console.log(new Date(), 'Updating handicap', betHash, dbBet, bet);

        db.get('handicapChanges')
          .push({ betHash: betHash, oldHandicap: dbBet.handicap, newHandicap: bet.handicap, originallyScraped: dbBet.scraped, changed: moment().format() })
          .write();

        db.get('bets')
          .find({ id: betHash })
          .assign({ price: bet.price, scraped: moment().format() })
          .write();
      }
    }
  });

  console.log(new Date(), 'Proccesed bets...');
};
