var bter = require('bter')

module.exports = history

function history(cb){
    bter.getDepth({ CURR_A: 'xcp', CURR_B: 'btc' }, function(err, result) {
    if(err) console.log(err);
    else{
      cb(null, result)
    }
  });
}


