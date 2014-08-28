var fs = require('fs')

var bter = require('bter')
var closeness = require('closeness')
var key = fs.readFileSync('./bter.key', 'utf8').trim()
var secret = fs.readFileSync('./bter.secret', 'utf8').trim()


var orders = {}
var history = {}

var trade = {}
trade.API_KEY = key
trade.SECRET_KEY = secret
var BUYER = new Object(trade)
var SELLER = new Object(trade)
var CHECKER = new Object(trade)

BUYER.TYPE = 'BUY'
SELLER.TYPE = 'SELL'
var t1 = global.t1
var t2 = global.t2

var T1 = t1.toUpperCase()
var T2 = t2.toUpperCase()

BUYER.PAIR = SELLER.PAIR = t1+'_'+t2
var funds, escrow;
var gr = 1 / 1.62

var tData
var mData

module.exports = function(mData, tData){
  mData = mData, tData = tData
  getOrderList(function(err, data){

    if(!err){
      prune(function(){
        setTimeout(function(){
          getFunds(function(err, data){
            fract(mData)
            console.log('***hiBuy***', tData.hiBuy) //  current balances
            console.log('**lowSell**', tData.lowSell) //  current balances
            console.log('***ma80***', mData[2]) //  current balances
          })
        }, 30)
      })      
     // console.log(data) // all open orders 
    }
  })
} 

function fract(mData){
  var h = mData[0]
  var l = mData[1]
  var ma = mData[2]
  var last = mData[3]
  var hDiff = h - ma
  var lDiff = ma - l
  var grH = hDiff * gr // the differentials are high/farthest
  var grL = lDiff * gr // so price and amount accordingly
  var beatIT = closeness(ma, .0001)
  
  if(funds[T1] >= .01){
    var askPrice = Math.max(h, ma)
    var aa = 0;
    funds[T1] -= (aa = funds[T1] * gr * gr)
    var askAmount = aa
    sell({RATE: askPrice, AMOUNT: askAmount}, console.log)
    console.log('ASK', askPrice, askAmount)
  }  
  
  if(funds[T2] >= .00075){
    var bidPrice = Math.min(l, ma) 
    var ff = 0;
    funds[T2] -= (ff = (funds[T2] * gr * gr) + .00001)
    var bidAmount = ff / bidPrice
    buy({RATE: bidPrice, AMOUNT: bidAmount}, console.log)
    console.log('BID', bidPrice, bidAmount)
  }
  
  if(funds[T1] >= .01 || funds[T2] >= .00075 ){
    fract([h * .995 , l * 1.005, ma * 1.0051, last])
  }  

}

function cancel(id, oid, cb){
  var c = {}
  c.API_KEY = key
  c.SECRET_KEY = secret
  c.ORDER_ID = oid
  console.log('***CANCEL****', c) 
  if(!oid) cb(null, 'buh')
  else{
    bter.cancelOrder(c, function(err, result){
      if(err) console.log(err)
      else{
        if(cb) cb(null, true)
      }
    })
  }
}

function prune(cb){
  var now = new Date().getTime()
  var flag = 0
  for(var i in orders){
    if(orders[i].status !== 'open') {
      history[i] = orders[i]     
      delete orders[i]
      console.log(history)
    }
    else if(!orders[i]){}
    else{
      if(false && now - orders[i].time > 1000 * 60 * 11){
        ++flag
        cancel(orders[i].id, orders[i].oid, function(err, res){
          if(!err) {
            delete orders[i]
            --flag
            if(flag==0) cb(null)
          }
        })
      }
    }
  }
  if(flag==0) cb(null)
}

function getFunds(cb){
  bter.getFunds(trade, function(err, data){
    if(err) console.log(err)
    else{
      funds = data.available_funds
      escrow = data.locked_funds
      for(var x in funds){
        funds[x] = Number(funds[x])
      }
      for(var x in escrow){
        escrow[x] = Number(escrow[x])
      }
      if(cb) cb(null, data)
    }
  })  
}

function check(oid, cb){
  var chk = new Object(CHECKER)
  chk.ORDER_ID = oid
  bter.getOrderStatus(chk, function(err, data){
    if(err) console.log(err)
    else{
      var order = data.order
      var id = order.id
      if(orders[id].status != order.status){
        // order has changes
        getFunds(null)     
      }
      orders[data.order.id] = data.order
      if(cb) cb(null, data.order)
    }
  })
}

function sell(params, cb){
  var obj = new Object(SELLER)
  for(x in params) obj[x] = params[x]

  bter.placeOrder(obj, function(err, data){
    if(err) console.log(err)
    else if(data.msg.toLowerCase() == 'success') {
      data.status = 'open'
      data.time = new Date().getTime()
      orders[data.order_id] = data      
      
      if(cb) cb(null, data)
      //check(data.order_id, null)
    }
  })
}

function buy(params, cb){
  var buyer = new Object(BUYER)
  buyer.TYPE = 'BUY'
  for(x in params) buyer[x] = params[x]
 // console.log(buyer)
  bter.placeOrder(buyer, function(err, data){
    if(err) console.log(err.toString())
    else if(data.msg.toLowerCase() == 'success') {
      data.status = 'open'
      data.time = new Date().getTime()
      orders[data.order_id] = data      
      if(cb) cb(null, data)
//      check(data.order_id, null)
    }
  })
}

function cancelAll(){
  getOrderList(function(err, data){
  
    data.orders.forEach(function(e){
      e.time = new Date().getTime()
      orders[e.id] = e
    })
  
  })
}

function getOrderList(cb){
  bter.getOrderList(CHECKER, function(err, data){
    if(err) console.log(err)
    else {
      
      data.orders.forEach(function(e){
        e.time = new Date().getTime()
        if(!orders[e.id]){
          orders[e.id] = e
        }
      })
  
      console.log('**ORDERS***', orders) //  current balances
      if(cb) cb(null, orders)
    
    }
  })
}


