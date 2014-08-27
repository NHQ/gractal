var getHistory = require('./history');
var getOrders = require('./orders');
var trade = require('./trade');

var asks = [], bids = [];

var ma80, h80, l80, last;

var hiBuy = 0, lowSell = 0;

setInterval(runit, 1000 * 30)
runit()

function runit(){
  try{
    getHistory(function(err, h, l, ma, last){
      if(err){console.log(err)}
      else{
        ma80 = ma
        l80 = l
        h80 = h
        last = last
        trade(Array.prototype.slice.apply(arguments, [1]))
      }
    })
  }catch(err){
    runnit()
  }
}
/*
getOrders(function(err, data){
  if(err) console.log(err)
  else{
    asks = data.asks
    bids = data.bids
    hiBuy = bids.shift()
    lowSell = asks.pop()
    //console.log(hiBuy, lowSell)
  }
})
*/
