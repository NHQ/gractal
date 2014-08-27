var bter = require('bter')
var dedupe = require('dedupe')

var last
var wma80 = 0
var ma80 = 0
var h80 = 0
var l80 = Infinity
var ma20 = 0
var xcp = 20
var btc = 0
var aveBuy = .0038
var aveSell = -Infinity
var buys = []
var sells = []
var mavs = []

module.exports = history

function history(cb){
    bter.getHistory({ CURR_A: 'xcp', CURR_B: 'btc' }, function(err, result) {
    if(err) console.log(err);
    else{
      var data = dedupe(result.data, function(val){return val.tid})
      mavs.concat(result.data)
      
      var l = result.data.length / 4
      ma80 = result.data.slice(Math.floor(l)).reduce(function(p,e,i){
        h80 = Math.max(h80, e.price)
        l80 = Math.min(l80, e.price)
        return p += e.price
      }, 0) / (result.data.length - (Math.floor(l))) 
 /*
      wma80 = result.data.reduce(function(p,e,i){
        
        p[0] += e.amount
        p[1] += (e.price * e.amount)
        return p
      
      }, [0,0])

      wma80 = wma80[1] / wma80[0]
*/    
      last = result.data[result.data.length - 1].price

      result.data.forEach(function(e){
        if(e.type == 'buy'){
          buys.push(e)
        }
        else if(e.type == 'sell'){
          sells.push(e)
        }
      })
      
      sells = dedupe(sells)
      buys = dedupe(buys)

      cb(null, h80, l80, ma80, last, buys, sells)

    }
  });
}
