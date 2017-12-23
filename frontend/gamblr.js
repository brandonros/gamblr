function generatePriceChangeChart(line, prices) {
  var priceColumn = ['price'];
  var xColumn = ['x'];

  prices.forEach(function(price, index) {
    priceColumn.push(price.price);
    xColumn.push(moment(price.time).format('YYYY-MM-DD hh:mm'));
  });

  c3.generate({
    bindto: `#price-chart-${line.id}`,
    data: {
      x: 'x',
      xFormat: '%Y-%m-%d %H:%M',
      columns: [
        xColumn,
        priceColumn
      ]
    },
    axis: {
      x: {
        type: 'timeseries',
        localtime: true,
        tick: {
          format: '%Y-%m-%d %H:%M'
        }
      }
    }
  });
}

function generateHandicapChangeChart(line, handicaps) {
  var handicapColumn = ['handicap'];
  var xColumn = ['x'];

  handicaps.forEach(function(handicap, index) {
    handicapColumn.push(handicap.handicap);
    xColumn.push(moment(handicap.time).format('YYYY-MM-DD hh:mm'));
  });

  c3.generate({
    bindto: `#handicap-chart-${line.id}`,
    data: {
      x: 'x',
      xFormat: '%Y-%m-%d %H:%M',
      columns: [
        xColumn,
        handicapColumn
      ]
    },
    axis: {
      x: {
        type: 'timeseries',
        localtime: true,
        tick: {
          format: '%Y-%m-%d %H:%M'
        }
      }
    }
  });
}

(async function() {
  var db = await (await fetch('/backend/db.json')).json();

  db.lines.sort(function(a, b) {
    var aLine = `${a.startTime} - ${a.game} - ${a.betType} - ${a.outcome}`.trim().trimLeft();
    var bLine = `${b.startTime} - ${b.game} - ${b.betType} - ${b.outcome}`.trim().trimLeft();

    if (a < b) {
      return -1;
    }

    if (a > b) {
      return 1;
    }

    return 0;
  });

  var html = '<option value=""></option>';

  db.lines.forEach(function(line) {
    var prices = db.prices.filter(function(price) {
      return line.id === price.lineHash;
    });

    var handicaps =  db.handicaps.filter(function(handicap) {
      return line.id === handicap.lineHash;
    });

    html += `<option value="${line.id}">${line.startTime} - ${line.game} - ${line.betType} - ${line.outcome} (${prices.length} price changes, ${handicaps.length} handicap changes)</option>`;
  });

  $('#line').html(html);

  $('#line').on('change', function() {
    $('.chart').remove();

    var lineId = $('#line').val();

    if (!lineId) {
      return;
    }

    var line = db.lines.find(function(line) {
      return line.id === lineId;
    });

    var prices = db.prices.filter(function(price) {
      return line.id === price.lineHash;
    });

    var handicaps =  db.handicaps.filter(function(handicap) {
      return line.id === handicap.lineHash;
    });

    $('.container').append(`<div class="chart">
        <strong>${line.game}<br>${line.betType} ${line.outcome}<br>${line.startTime}</strong>
        <div id="price-chart-${line.id}"></div>
        <div id="handicap-chart-${line.id}"></div>
      </div>`);

    generatePriceChangeChart(line, prices);

    if (handicaps.length) {
      generateHandicapChangeChart(line, handicaps);
    }
  }); 
})();
