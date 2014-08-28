global.args = require('minimist')(process.argv.slice(2))
global.t1 = args.t1 || 'xcp'
global.t2 = args.t2 || 'btc'

var getHistory = require('./history');
var getOrders = require('./orders');
var trade = require('./trade');
var asks = [], bids = [];

var ma80, h80, l80, last;

var hiBuy = 0, lowSell = 0;

setInterval(runit, 1000 * 15)
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
        var args = arguments 
        getOrders(function(err, data){
          if(err) console.log(err)
          else{
            var xxxx = {
              asks : data.asks,
              bids : data.bids,
              hiBuy : data.bids.shift(),
              lowSell : data.asks.pop()
            }

            //console.log(hiBuy, lowSell)
            trade(Array.prototype.slice.apply(args, [1]), xxxx)
          }
        })
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
