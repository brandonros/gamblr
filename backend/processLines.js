var low = require('lowdb');
var FileSync = require('lowdb/adapters/FileSync');
var moment = require('moment');
var hash = require('object-hash');

var getLinesWithOutcomes = require('./getLinesWithOutcomes');

function insertLine(db, lineHash, lineWithOutcome, batchTime) {
  var model = { 
    scraped: batchTime,
    updated: batchTime, 
    id: lineHash,
    game: lineWithOutcome.game,
    startTime: lineWithOutcome.startTime,
    betType: lineWithOutcome.betType,
    outcome: lineWithOutcome.outcome,
    lastPrice: lineWithOutcome.price
  };

  if (lineWithOutcome.handicap) {
    model.lastHandicap = lineWithOutcome.handicap;
  }

  db.get('lines')
    .push(model)
    .write();

  db.get('prices')
    .push({ 
      lineHash: lineHash, 
      price: lineWithOutcome.price, 
      time: batchTime
    })
    .write();

  if (lineWithOutcome.handicap !== undefined) {
    db.get('handicaps')
      .push({ 
        lineHash: lineHash, 
        handicap: lineWithOutcome.handicap, 
        time: batchTime
      })
      .write();
  }
}

function updateLinePrice(db, lineHash, lineWithOutcome, batchTime) {
  db.get('prices')
    .push({ 
      lineHash: lineHash, 
      price: lineWithOutcome.price,
      time: batchTime
    })
    .write();

  db.get('lines')
    .find({ id: lineHash })
    .assign({ 
      lastPrice: lineWithOutcome.price, 
      updated: batchTime
    })
    .write(); 
}

function updateLineHandicap(db, lineHash, lineWithOutcome, batchTime) {
  db.get('handicaps')
    .push({ 
      lineHash: lineHash, 
      handicap: lineWithOutcome.handicap,
      time: batchTime
    })
    .write();

  db.get('lines')
    .find({ id: lineHash })
    .assign({ 
      lastHandicap: lineWithOutcome.handicap, 
      updated: batchTime
    })
    .write();
}

module.exports = async function() {
  var adapter = new FileSync('db.json');
  var db = low(adapter);

  db.defaults({ lines: [], prices: [], handicaps: [] })
    .write();

  var linesWithOutcomes = await getLinesWithOutcomes();

  var batchTime = moment().format();

  linesWithOutcomes.forEach(function(lineWithOutcome) {
    var lineHash = hash({
      game: lineWithOutcome.game,
      startTime: lineWithOutcome.startTime,
      betType: lineWithOutcome.betType,
      outcome: lineWithOutcome.outcome
    });

    var dbLine = db.get('lines')
      .find({ id: lineHash })
      .value();

    if (!dbLine) {
      console.log(new Date(), 'Inserting', lineWithOutcome.game, lineWithOutcome.startTime, lineWithOutcome.betType, lineWithOutcome.outcome, lineWithOutcome.price, lineWithOutcome.handicap);

      insertLine(db, lineHash, lineWithOutcome, batchTime);
    } else {
      if (dbLine.lastPrice !== lineWithOutcome.price) {
        console.log(new Date(), 'Updating price', lineWithOutcome.game, lineWithOutcome.startTime, lineWithOutcome.betType, lineWithOutcome.outcome, lineWithOutcome.price, lineWithOutcome.handicap, dbLine.lastPrice);

        updateLinePrice(db, lineHash, lineWithOutcome, batchTime);
      }

      if (dbLine.lastHandicap !== undefined && dbLine.lastHandicap !== lineWithOutcome.handicap) {
        console.log(new Date(), 'Updating handicap', lineWithOutcome.game, lineWithOutcome.startTime, lineWithOutcome.betType, lineWithOutcome.outcome, lineWithOutcome.price, lineWithOutcome.handicap, dbLine.lastHandicap);

        updateLineHandicap(db, lineHash, lineWithOutcome, batchTime);
      }
    }
  });

  console.log(new Date(), 'Proccesed lines...');
};
