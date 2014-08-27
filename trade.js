var fs = require('fs')

var bter = require('bter')
var key = fs.readFileSync('./bter.key', 'utf8').trim()
var secret = fs.readFileSync('./bter.secret', 'utf8').trim()

var orders = {}

var trade = {}
trade.API_KEY = key
trade.SECRET_KEY = secret
var BUYER = new Object(trade)
var SELLER = new Object(trade)
var CHECKER = new Object(trade)

BUYER.TYPE = 'BUY'
SELLER.TYPE = 'SELL'
BUYER.PAIR = SELLER.PAIR = 'xcp_btc'

var funds, escrow;
var gr = 1 / 1.62

module.exports = function(mData){
  console.log(mData)
  getOrderList(function(err, data){
    console.log(orders)
    if(!err){
      prune(function(){
        setTimeout(function(){
          getFunds(function(err, data){
            console.log('**BALANCE***', data) //  current balances
            fract(mData)
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

  if(funds['XCP'] >= .1){
    var askPrice = h - grH
    var aa = 0;
    funds['XCP'] -= (aa = funds['XCP'] * gr)
    var askAmount = aa
    sell({RATE: askPrice, AMOUNT: askAmount}, console.log)
    console.log('ASK', askPrice, askAmount)
  }  
  
  if(funds['BTC'] >= .00075){
    var bidPrice = ma - grL
    var ff = 0;
    funds['BTC'] -= (ff = (funds['BTC'] * gr) + .00001)
    var bidAmount = ff / bidPrice
    buy({RATE: bidPrice, AMOUNT: bidAmount}, console.log)
    console.log('BID', bidPrice, bidAmount)
  }
  
  if(funds['XCP'] >= .1 + aa || funds['BTC'] >= .00075 + ff){
    fract([h * 92, l * 1.1, ma * 1.0051, last])
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
    if(orders[i].status !== 'open') delete orders[i]
    else if(!orders[i]){}
    else{
      if(now - orders[i].time > 1000 * 60){
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

      if(cb) cb(null, orders)
    
    }
  })
}


