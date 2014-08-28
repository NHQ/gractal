var bter = require('bter')

module.exports = history

function history(cb){
    bter.getDepth({ CURR_A: t1, CURR_B: t2 }, function(err, result) {
    if(err) console.log(err);
    else{
      cb(null, result)
    }
  });
}


