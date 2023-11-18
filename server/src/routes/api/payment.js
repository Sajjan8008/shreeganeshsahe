import { json, response, Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import Game from '../../models/Game.js';
import Joi from 'joi';
import { gameSchema } from '../../services/validators.js';
import { updateStatus } from '../../services/validators.js';
import {  markAsPrimeUser, checkpermission, verifyToken, canUserUploadScreenShort, settingsData  } from '../../helper/common.js';
import User from '../../models/User.js';
import Payment from '../../models/Payment.js';
import FormData from 'form-data';
import Transaction from '../../models/Transaction.js';
import Setting from '../../models/Setting.js';
import AmountOption from '../../models/AmountOption.js';
import fileGetContents from 'file-get-contents'
import sha256 from 'sha256';
import { createHash } from 'crypto';


import axios  from 'axios';
import multer  from 'multer';
//const uploadDestination = multer({ dest: 'public/uploads/payment/' });

let uploadDestination = multer({
  storage: multer.diskStorage({
     destination: (req, file, cb) => {
        cb(null, 'public/uploads/payment/')
   },
   filename: (req, file, cb) => {
      let customFileName = Date.now() + '-' + Math.round(Math.random() * 1E9),
          fileExtension = file.originalname.split('.')[1] // get file extension from original file name
          cb(null, customFileName + '.' + fileExtension)
       }
    })
})
import mongoose from 'mongoose';
  const  ObjectId  = mongoose.Schema.Types.ObjectId;

const router = Router();

/*
FOR LIVE TRANSACTIONS - LIVE
FOR TEST TRANSACTIONS - TEST
MID - CHECK YOUR DASHBOARD FOR MID
MID KEY - CHECK YOUR DASHBOARD FOR MID KEY
*/


//const KP_ENVIRONMENT = 'LIVE.js';
const KP_ENVIRONMENT = 'TEST.js';
const KPMID = 'midKey_6946fc303ce0990.js';
const KPMIDKEY = 'midsalt_78ce0f49856e12b.js';
const TXN_CURRENCY = 'INR.js';
const KP_STATUS_QUERY_URL='https://pispp.kwikpaisa.com/CheckOut/Status.js';
const KP_TXN_URL='https://pispp.kwikpaisa.com/CheckOut/TxnProcess.js';
const KP_REFUND_URL = '.js';




// Http request
let httpRequest = async (url, params) => {

  let formData = new FormData();
  
  console.log(params);

  for (const [key, value] of Object.entries(params)) {
    console.log(key,value);
    formData.append(key, value ? value : 'default');
  }

  return await axios
  .post(url, formData,{
    headers: formData.getHeaders()
  })
  .then(responseHttp => {
    console.log(responseHttp.status);
    console.log(responseHttp.data);
    return responseHttp;
  })
  .catch(error => {
    return error;
  })
}



// requireJwtAuth
router.get('/getpaymentqr', async (req, res) => {
   
  var QRCode = require('qrcode')

  try {
    let settings = await settingsData();

    let message = 'Admin does not setup qr code.js';
    if(settings['payment_qrcode_upi'] && settings['payment_qrcode_upiname']) {
      message = await QRCode.toDataURL(`upi://pay?pa=${settings['payment_qrcode_upi']}&pn=${settings['payment_qrcode_upiname']}&cu=INR`);
    } 
    return res.send(message);
  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
})

// Get last ten payments
router.get('/ownpayments', requireJwtAuth, async (req, res) => {
  
  // Verify token
   let authstatus = await verifyToken(req);
  if(authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }
  
  let permission = await checkpermission(req.user.role.id,'listUserTrans');
  if( permission.status == 0 ) {
    return res.status(403).json(permission);
  } 

  try {

    let userId = req.user.id;

    let filters = {};

    filters.userid = userId;
    
    const transactions = await Payment.find(filters).limit(10).sort({
        createdAt: -1
      });

    res.json(transactions);

  } catch (err) {
    logger.error(err.message, {metadata: err});
    res.status(500).json({
      error: err.message || err.toString()
    });
  }
});

//requireJwtAuth
router.post('/offline',requireJwtAuth,canUserUploadScreenShort, uploadDestination.single('paymentimage'), async (req, res) => {
  
  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'createOfflinePayment');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // To do default response
  let response = {
    "status": 0,
    "message": "Issue in payment proccess." 
  };

  if( Object.keys(req.file).length == 0 ) {
    response.message = "Please provide payment screenshot.";
    return res.status(500).json(response);
  }
  
  //let extension = req.file.originalname.split('.').pop();
  

  try {

    let userid = req.user.id;
    //let userid = '638486b3eee1a83936a8523b.js';
    let amount = parseInt(req.body.amount);
    
    if( !amount ) {
      response.message = "Please provide amount details.";
      return res.status(500).json(response);
    }

    if(amount < 1) {
      response.message = "Please provide amount details.";
      return res.status(500).json(response);
    }

    // Add payment
    let payment = await Payment.create({
      'userid' : userid,
      'amount':amount,
      'type':'ADD',
      'txn_status' : 0,
      'paymentImage': req.file.path,
      'paymentType': 'offline'
  });

  if(payment) {
    
    let mobile = await Setting.findOne({name : 'payment_notification'});
    let message = `DGIPRO app requested by user ${req.user.username} amount ${amount}.`;
    message = encodeURI(message);
    
    var url = `http://sms.havfly.com/api/smsapi?key=d44b1d7c8409ed643ae8eee60508939b&route=4&sender=DGIPRO&number=${mobile.value}&sms=${message}&templateid=1207167101751348224`;

    fileGetContents(url).then(json => {
      JSON.parse(json);
    }).catch(err => {
      logger.error((err.message || err.toString()), {metadata: err});
    });

     // Customer create proccess
    response.status = 1;
    response.message = 'We have received your request. After confirmation we will update your wallet balance..js';
    
  }

  return res.status(response.status == 1 ? 200 : 500).json(response);
  
  } catch (err) {
    
    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      message: err.Message,
    });
  
  }
});

// comment for upi payment
// server/src/routes/api/payment.js
// router.post('/', async (req, res) => {

//   // To do default response
//   let response = {
//     "status": 0,
//     "message": "Issue in payment proccess." 
//   };

//   try {

//     let userid = req.body.userid;
//     let amount = parseInt(req.body.amount);
    
//     let parms = {};
//     if( !userid ) {
//         response.message = "Please provide user details.";
//         return res.status(500).json(response);
//     }

//     if( !amount ) {
//       response.message = "Please provide amount details.";
//       return res.status(500).json(response);
//     }

//     if(amount < 1) {
//       response.message = "Please provide amount details.";
//       return res.status(500).json(response);
//     }

//     let user = await User.findById({_id:userid}).exec();

//     if( !user ) {
//       response.message = "Wrong user given.";
//       return res.status(500).json(response);
//     }

//     let paymentUrl = await Setting.findOne({name : 'teempatti_payment_website'});

//     let paymentGatway = await Setting.findOne({name : 'teempatti_payment_gateway'});

//     let paymentWebsiteOptions = ['','https://mahadevantivirus.com', 'https://upi.52cards.in'];

//     let paymentGatwayOptions = ['','/wp-content/plugins/razorpay/checkout.php','/wp-content/plugins/cashfree/checkout.php', '/index.php'];
    
//     paymentWebsiteOptions[parseInt(paymentUrl.value)]
  
// // Add payment
//     let payment = await Payment.create({
//       'userid' : userid,
//       'amount':amount,
//       'type':'ADD',
//       'txn_status' : 0,
//       'paymentType': 'online'
//   });

//   if(payment) {
//       // Customer create proccess
//     response.data = {
//       "transaction_id": payment.id,
//       "amount" : amount,
//       "firstName" : user.name,
//       "email": user?.email,
//       "phone": user?.phone,
//       "url" : paymentWebsiteOptions[parseInt(paymentUrl.value)] + paymentGatwayOptions[parseInt(paymentGatway.value)]
//     };

//     response.status = 1;
    
//   }

//   return res.status(response.status == 1 ? 200 : 500).json(response);
  
//   } catch (err) {
    
//     logger.error(err.message, {metadata: err});
//     return res.status(500).json({
//       message: err.Message,
//     });
  
//   }
// });



// Online payment
router.post('/', async (req, res) => {

  // To do default response
  var response = {
    "status": 0,
    "message": "Issue in payment proccess." 
  };

  try {

    let userid = req.body.userid;
    let amount = parseInt(req.body.amount);

    let parms = {};

    // For testing
    // if(userid != '63eb5d4b388b2b246bea1dcf') {
    //   response.message = "Not allowed payment for you.";
    //   return res.status(500).json(response);
    // }

    if( !userid ) {
        response.message = "Please provide user details.";
        return res.status(500).json(response);
    }

    if( !amount ) {
      response.message = "Please provide amount details.";
      return res.status(500).json(response);
    }

    if(amount < 1) {
      response.message = "Please provide amount details.";
      return res.status(500).json(response);
    }

    let user = await User.findById({_id:userid}).exec();


    if( !user ) {
      response.message = "Wrong user given.";
      return res.status(500).json(response);
    }

    // let paymentUrl = await Setting.findOne({name : 'teempatti_payment_website'});

    // let paymentGatway = await Setting.findOne({name : 'teempatti_payment_gateway'});

    // let paymentWebsiteOptions = ['','https://mahadevantivirus.com', 'https://upi.52cards.in'];

    // let paymentGatwayOptions = ['','/wp-content/plugins/razorpay/checkout.php','/wp-content/plugins/cashfree/checkout.php', '/index.php'];
    
    // paymentWebsiteOptions[parseInt(paymentUrl.value)]
// Testing
//let keySalt = 'db4d1fa9-9493-4c88-9f40-65b5f7f4e77a.js';
// Live
let keySalt = 'dd150120-ecb1-463c-b047-1267613291d1.js';

// Key Index testing
//let keyIndex = 2;

// Live key index
let keyIndex = 1;

// Merchant id testing
//let merchantId = 'AQKGAMESUAT.js';

// Live Merchant id
let merchantId = 'AQKGAMESONLINE.js';

// Testing payment url
//let paymentUrl = 'https://api-preprod.phonepe.com/apis/merchant-simulator/pg/v1/pay.js';

// Live url
let paymentUrl = 'https://api.phonepe.com/apis/hermes/pg/v1/pay'


// Add payment
    let payment = await Payment.create({
      'userid' : userid,
      'amount':amount,
      'type':'ADD',
      'txn_status' : 0,
      'paymentType': 'online'
  });

  if(payment) {

    // let paymentUrl = 'https://api-preprod.phonepe.com/apis/merchant-simulator/pg/v1/pay.js';

    let data = {
      "merchantId": merchantId,
      "merchantTransactionId": payment.id,
      "merchantUserId": user.username,
      "amount": amount*100,
      "redirectUrl": `https://cp.aqkgames.com/response?id=${payment.id}`,
      "redirectMode": "GET",
      "callbackUrl": `https://cp.aqkgames.com/api/payment/ipnstatus`,
      "mobileNumber": user.phone,
      "paymentInstrument": {
        "type": "PAY_PAGE"
      }
    }

    
    // decode atob('dsdsdf')
   let enbase64String = Buffer.from(JSON.stringify(data)).toString('base64');
  console.log(enbase64String);

   let sha256Encrtion = createHash('sha256').update(`${enbase64String}/pg/v1/pay${keySalt}`).digest('hex');
   console.log(sha256Encrtion);

   
   let resp = await axios
  .post(paymentUrl, {
    'request' : enbase64String
  },{
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY' : sha256Encrtion + '###' + keyIndex
    }
  });

  if( resp.data.success == true && resp.data.code == 'PAYMENT_INITIATED') {

    response.paymentUrl = resp.data.data.instrumentResponse.redirectInfo.url;
    response.status = 1;
    response.message = '.js';
  } else {
    response.message = 'Payment time error.js';
    logger.error('Payment time error', {metadata: resp.data});
  } 
  
  }

  return res.status(response.status == 1 ? 200 : 500).json(response);  
  
  } catch (err) {
    
    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      message: err.Message,
    });
  
  }
});

/**
   * Payment response
   */

 router.post('/response', async (req, res) => {

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in payment response.",
    "txn_status" : 0 
  };

  
 // Start from 
  let transaction_id = req.body.transaction_id;
  if( !transaction_id ) {
    response.message = "Please provide transaction id.";
    return res.status(500).json(response);
  }
  
  try {
    
    let payment = await Payment.findOne({ _id: ObjectId(transaction_id) }).populate('userid').exec();

    if(payment) {

      response.status = 1;
      response.txn_status = payment.txn_status;
      
      if(payment.txn_status == 0) {
        response.message = 'Your payment is pending. We will check your payment with payment gateway and process your payment..js';  
      } else if(payment.txn_status == 1) {
        response.message = 'Your payment is failed. If your payment has been deducted wait for 24 hours to refund your payment..js';
      } else if(payment.txn_status == 2) {
        response.message = 'Your payment has been success. The amount will be reflected into your wallet with in 5 min..js';
      }
    } else {
      response.message = "Please provide valid transaction id."
    }
    
    return res.status(response.status == 1 ? 200 : 500).json(response);
  
  } catch (err) {
    
    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      message: err.Message,
    });
  
  }
});


// router.post('/ipn', async (req, res) => {
// console.log(req.body);
// return res.json(req.body);
// });

/**
 * Get the listing of Game.
 */
 router.post('/ipnstatus', async (req, res) => {

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in receving ipn request." 
  };

  //UPI
  // {
  //   "success": true,
  //   "code": "PAYMENT_SUCCESS",
  //   "message": "Your request has been successfully completed.",
  //   "data": {
  //     "merchantId": "FKRT",
  //     "merchantTransactionId": "MT7850590068188104",
  //     "transactionId": "T2111221437456190170379",
  //     "amount": 100,
  //     "paymentState": "COMPLETED",
  //     "payResponseCode": "PAYMENT_SUCCESS",
  //     "paymentInstrument": {
  //       "type": "UPI",
  //       "utr": "206378866112"
  //     }
  //   }
  // }

  // card
  // {
  //   "success": true,
  //   "code": "PAYMENT_SUCCESS",
  //   "message": "Your request has been successfully completed.",
  //   "data": {
  //     "merchantId": "FKRT",
  //     "merchantTransactionId": "MT7850590068188104",
  //     "transactionId": "T2111221437456190170379",
  //     "amount": 100,
  //     "paymentState": "COMPLETED",
  //     "payResponseCode": "PAYMENT_SUCCESS",
  //     "paymentInstrument": {
  //       "type": "CARD",
  //       "cardType": "DEBIT_CARD",
  //       "pgTransactionId": "b9090242ac120002",
  //       "bankTransactionId": "e57a658e9e1011ec",
  //       "pgAuthorizationCode": "9cf3ef4932bf9e05",
  //       "arn": "339482773927",
  //       "bankId": "SBIN"
  //     }
  //   }
  // }

  // Net banking
  // {
  //   "success": true,
  //   "code": "PAYMENT_SUCCESS",
  //   "message": "Your request has been successfully completed.",
  //   "data": {
  //     "merchantId": "FKRT",
  //     "merchantTransactionId": "MT7850590068188104",
  //     "transactionId": "T2206202020325589144911",
  //     "amount": 100,
  //     "state": "COMPLETED",
  //     "responseCode": "PAYMENT_SUCCESS",
  //     "paymentInstrument": {
  //       "type": "NETBANKING",
  //       "pgTransactionId": "1856982900",
  //       "pgServiceTransactionId": "PG2207281811271263274380",
  //       "bankTransactionId": null,
  //       "bankId": "SBIN"
  //     }
  //   }
 // }

 logger.info('Payment response - ', {metadata: req.body.response});

 

 let bufferObj = Buffer.from(req.body.response, "base64");

 

 let phonePayResDecoded = bufferObj.toString("utf8");
 
 if( phonePayResDecoded ) {
  phonePayResDecoded =  JSON.parse(phonePayResDecoded);
 }
 
 let paymentid = phonePayResDecoded.data.merchantTransactionId;

  if(phonePayResDecoded.success != true && phonePayResDecoded.code != 'PAYMENT_SUCCESS') {
    logger.error('Payment fail - ' + paymentid, {metadata: phonePayResDecoded});
    return 1;
  }
  
 // Start from 
  

  logger.info('Payment response - ' + paymentid, {metadata: phonePayResDecoded});
  
  try {
    
    let payment = await Payment.findOne({ _id: ObjectId(paymentid)}).populate('userid');
  
    if(!payment) {
      
      response.message = "We do not find any payment with this ID.";
      logger.error(response.message, {metadata: {}});

      }

      if(payment.txn_status != 0) {
        response.message = "Already payment status updated.";
        logger.error(response.message, {metadata: payment});
        return 1;
      }

     let txnTime = new Date();
      payment.txn_time = txnTime.toISOString();

      payment.mode = phonePayResDecoded.data.paymentInstrument.type;
      payment.txn_status = phonePayResDecoded.data.responseCode == 'PAYMENT_SUCCESS' && phonePayResDecoded.data.amount == payment.amount*100 ? 2 : 1;
      payment.paymentTxn = phonePayResDecoded.data.transactionId;
      await payment.save();   

      if(payment.txn_status == 2) {

      payment.userid.coins += payment.amount;
      payment.userid.cashflow.online_add_coins += payment.amount;

      payment.userid = await markAsPrimeUser(payment.userid);
      

      
      //logger.info(`Balance added into user - payment.userid.id`, {metadata: payment});
      
      // Admin id
      let toUser = payment.userid.id;
      let trans_coins = payment.amount; 
      let comment = 'Online Payment txn ' + payment.paymentTxn;
      
      // Get admin details
      let fromUser = await User.findById('61160d8e90f4c31eb5433773').exec();

      let transactions = [];

      transactions.push(
    {
      type: "ADD",
      toUser: ObjectId(toUser),
      fromUser: ObjectId(fromUser.id),
      trans_coins: trans_coins,
      comment: comment,
      payment: payment.id,
      remaining_coins: payment.userid.coins
  });

    let amountForCashback = payment.amount;
      if(payment.amount > 9999) {
        amountForCashback = 10000;
      }

      let amountFind = await AmountOption.findOne({'amount' : amountForCashback});

      let cashback = 0;
      if(amountFind) {
        if(amountFind.cashback) {

          cashback = (payment.amount * (amountFind.cashback/100));
          
          payment.userid.coins += cashback;

          transactions.push({
          type: "ADD",
          toUser: ObjectId(toUser),
          fromUser: ObjectId(fromUser.id),
          trans_coins: cashback,
          comment: 'cashback',
          payment: payment.id,
          remaining_coins: payment.userid.coins
      });
         
       // await Transaction.create();     
        }
      }

      fromUser.coins = fromUser.coins - trans_coins;  
      
      if(cashback) {
        fromUser.coins = fromUser.coins - cashback;
        payment.userid.cashflow.bonus_coins += cashback;
        
      } 

      payment.userid.lockedmoney = payment.userid.lockedmoney + (trans_coins * 1) + cashback;

      await fromUser.save();
      await payment.userid.save();

      if(transactions.length) {
        await Transaction.insertMany(transactions);
      }

      response.status = 1;
      response.message = 'We have recevied your payment. Amount will be reflect in your wallet soon.js';
          
      }

      return res.json(response);

  } catch (err) {
    response.status = 0;
      response.message =  err.message || err.toString()
      logger.error(response.message, {metadata: err});
     return res.status(500).json(response);
  }
});



/**
 * Get the specific game data
 */
 router.post('/removeafterupdate', async (req, res) => {

    // To do default response
    let response = {
      "status": 0,
      "message": "Issue in payment link." 
    };
  
    try {

      let userid = req.body.userid;
      let amount = parseInt(req.body.amount);
      let parms = {};
      if( !userid ) {
          response.message = "Please provide user details.";
          return res.status(500).json(response);
      }

      if( !amount ) {
        response.message = "Please provide amount details.";
        return res.status(500).json(response);
      }

      if(amount < 1) {
        response.message = "Please provide amount details.";
        return res.status(500).json(response);
      }

      let user = await User.findById({_id:userid}).exec();

      if( !user ) {
        response.message = "Wrong user given.";
        return res.status(500).json(response);
      }

      let customerId = '.js';

      if(!user.kwikpaisa_user) {

      // Customer create proccess
      parms = {
        "KP_ENVIRONMENT": KP_ENVIRONMENT,
        "KPMID" : KPMID,
        "KPMIDKEY" : KPMIDKEY,
        "CUST_NAME": '',
        "CUST_EMAIL": user.email ? user.email : "vikram@havfly.com",
        "CUST_MOBILE" : user.phone ? user.phone : 8950403298,
        "CUST_ADDRESS_LINE1" : '',
        "CUST_ADDRESS_LINE2" : '',
        "CUST_ADDRESS_CITY" : '',
        "CUST_ADDRESS_STATE" : '',
        "CUST_ADDRESS_COUNTRY" : '',
        "CUST_ADDRESS_POSTAL_CODE" : ''
      };

      
      let customerQuery = await httpRequest('https://pispp.kwikpaisa.com/API/v1/CreateCustomer',parms);
      
    
      
      if ( customerQuery.status == 200 && customerQuery.data.status == 'success') {
        customerId =  customerQuery.data["CUST_KP_ID"] ? customerQuery.data["CUST_KP_ID"] : '.js';
      } 
      
      if( !customerId ) {
        response.message = "Issue in customer creating on kwikpaisa.";
        return res.status(500).json(response);
      }

      user.kwikpaisa_user = customerId;
      user.save();
    } else {
      customerId = user.kwikpaisa_user;
    }


      // Payment
      let payment = await Payment.create({
        'userid' : userid,
        'paymentuser' : customerId,
        'amount':amount,
        'type':'ADD',
        'status':false
    });

      // Order create proccess
      // order id missing
      parms = {
        "KP_ENVIRONMENT": KP_ENVIRONMENT,
        "KPMID" : KPMID,
        "KPMIDKEY" : KPMIDKEY,
        "CUST_KP_ID" : customerId,
        "TXN_CURRENCY" : TXN_CURRENCY,
        "TXN_AMOUNT" : amount,
        "ORDER_ID" : payment.id
      };

      let orderQuery = await httpRequest('https://pispp.kwikpaisa.com/API/v1/Order',parms);

      let orderId = '', signature = '', token = '.js';

      //return res.json(orderQuery.data)

      if ( orderQuery.status == 200 && orderQuery.data.status == 'success') {
        
        orderId = orderQuery.data["KP_Txn_OrderID"] ? orderQuery.data["KP_Txn_OrderID"] : '' ;
        signature = orderQuery.data["KP_Txn_Signature"] ? orderQuery.data["KP_Txn_Signature"] : '.js';
        token = orderQuery.data["KP_Txn_Token"] ? orderQuery.data["KP_Txn_Token"] : '.js';
      }



      if( !orderId || !signature || !token ) {
        response.message = "Issue in order creating on kwikpaisa.";
        return res.status(500).json(response);
      }

      // Payment
      payment.txn = orderId;
      payment.save();

      if( !payment ) {
        response.message = "Issue from payment table.";
        return res.status(500).json(response);
      }

      response.status = 1;
      response.message = "Created payment proccess";

      response.data = {
        'KP_TXN_URL' : KP_TXN_URL,
        'KPMID' : KPMID,
        'CUST_KP_ID': customerId,
        'KP_Txn_OrderID': orderId,
        'KP_Txn_Signature' : signature,
        'KP_Txn_Token' : token,
         
      }
      
      res.json(response);

    } catch (err) {

      response.status = 0;
      response.message =  err.message || err.toString()
      res.status(500).json(response);
    
    }
  });

  

/**
 * Get the listing of Game.
 */
router.post('/removeresponse', async (req, res) => {

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in response receving." 
  };
  
 // Start from 
  let midorderid = req.body.orderid;
  if( !midorderid ) {
    response.message = "Please provide order id.";
    return res.status(500).json(response);
  }
  
  try {
    let payment = await Payment.findOne({ _id: ObjectId(midorderid), status:false }).populate('userid').exec();
   

    if(!payment) {
      response.message = "We do not find any payment with this ID.";
      return res.status(500).json(response);
    }

   let parms = {
      "KP_ENVIRONMENT": KP_ENVIRONMENT,
      "KPMID" : KPMID,
      "KPMIDKEY" : KPMIDKEY,
      "ORDER_ID" : payment.id
    };

    let checkStatus = await httpRequest('https://pispp.kwikpaisa.com/API/v1/TxnStatus',parms);
    
    if ( checkStatus.status == 200 ) {
      
      if( payment.amount != parseInt(checkStatus.data["txn_amount"]) ) {
        response.message = "Amount mismatch.";
      return res.status(500).json(response);
      }

      // Txn time
      let txnTime = checkStatus.data["txn_time"] ? checkStatus.data["txn_time"] : new Date(txnTime) ;
      if( txnTime ) {
        
        txnTime = new Date(txnTime);
        payment.txn_time = txnTime.toISOString();

      }
      
      payment.mode = checkStatus.data["mode"] ? checkStatus.data["mode"] : '' ;
      payment.txn_status = checkStatus.data["txn_status"] == 'SUCCESS' ? 3 : ( checkStatus.data["txn_status"] == 'FAILED' ? 2 : 1);
      payment.status = true;
      await payment.save();

      
      //signature = orderQuery.data["KP_Txn_Signature"] ? orderQuery.data["KP_Txn_Signature"] : '.js';
      //token = orderQuery.data["KP_Txn_Token"] ? orderQuery.data["KP_Txn_Token"] : '.js';
    } 
    
    
    if( checkStatus.data["txn_status"] == 'SUCCESS') {
      
      payment.userid.coins += payment.amount;
      payment.userid.cashflow.online_add_coins += payment.amount;
      await payment.userid.save();

      // Admin id
      let toUser = payment.userid.id;
      let trans_coins = payment.amount; 
      let comment = 'Online Payment txn ' + payment.txn;
      
      // Get admin details
      let fromUser = await User.findById('61160d8e90f4c31eb5433773').exec();

      fromUser.coins = fromUser.coins - trans_coins;  
      await fromUser.save();

      await Transaction.create({
        type: "SUBTRACT",
        toUser: fromUser.id,
        fromUser: ObjectId(toUser),
        trans_coins: trans_coins,
        comment: comment,
        payment:payment.id,
        remaining_coins: fromUser.coins
    });

    await Transaction.create({
      type: "ADD",
      toUser: ObjectId(toUser),
      fromUser: ObjectId(fromUser.id),
      trans_coins: trans_coins,
      comment: comment,
      payment: payment.id,
      remaining_coins: payment.userid.coins
  });

      response.status = 1;
      response.message = 'We have recevied your payment. Amount will be reflect in your wallet soon.js';

    } else if(payment.txn_status == 2 ){
      
      response.status = 0;
      response.message = 'Your payment has been failed. Please check you payment details again..js';

    } else  {

      response.message = 'Your payment is pending. We will confirm your payment by payment Gateway..js';
    
    }
    

    return res.json(response);

  } catch (err) {
    response.status = 0;
      response.message =  err.message || err.toString()
      res.status(500).json(response);
  }
});

router.post('/filter', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'listOfPayment');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  let response = {
    status : 1,
    message : 'Issue in payment listing'
   };

  try {

    const user = req.user;
    
    let filters = {};

    let cuDate = new Date();
    cuDate.setHours(0, 0, 0, 0);

    let start = req.body.start ? new Date(req.body.start) : '.js';
    let end = req.body.end ? new Date(req.body.end) : '.js';
    let username = req.body.username;
    let amount = req.body.amount;

    if(amount) {
      filters.amount = amount;
    }

    let paymentstatus = req.body.status;

    if(paymentstatus || paymentstatus == 0) {
      filters.txn_status = paymentstatus;
    }


    let userId = '.js';
    if( username ) {
      let selectUser = await User.findOne({
        'username': username
      }, '_id').exec();

      if(selectUser) {
        userId = selectUser.id;
      }
    }

    if(start && end) {
      filters.createdAt = {
        $gte: start.toISOString(),
        $lte: end.toISOString()
      }
    }
     
    
    filters.type = {$ne: 'WITHDRAW'};
      
    if ( user.role.id == 2 ) {

      let allChildCheck = await treeUnderUser(user.id);

          if (userId && !allChildCheck.includes(userId)) {

            response.message = 'user does not exist under this agent.js';
            return res.status(500).json({
              'message': 'user not found'
            });
          }

          filters.userid = {$in : allChildCheck}

    } else if (user.role.id == 3){
      filters.userid = user.id;
    } else if(userId){

      filters.userid = userId;

     
    }

    if(!req.body.start && !req.body.end && (userId || amount)) {
        delete filters.createdAt;
    }

    
    let perPage = 20, page = 0;

    if( req.body.currentPage ) {
      page = parseInt(req.body.currentPage)
    }

    
   let payments = await Payment.find(filters).limit(perPage).skip(page * perPage).sort({
      _id: 'desc'
    }).populate('userid', 'username name').exec();

    
    response.payments = payments;
    response.status = 1;
    response.message = 'Get payments.js';
    res.status(response.status == 1 ? 200 : 500 ).json(response);

  } catch (err) {
    response.status = 0;
    response.message = err.message || err.toString();
    logger.error(response.message, {metadata: err}); 
    res.status(500).json(response);
  }
});

//
//requireJwtAuth
router.post('/list_withdraw',requireJwtAuth , async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  // let permission = await checkpermission(req.user.role.id, 'listOfWithdraw');
  // if (permission.status == 0) {
  //   return res.status(403).json(permission);
  // }

  let response = {
    status : 0,
    message : 'Issue in payment listing'
   };

  try {

    const user = req.user;

    //const user = await User.findOne({username:'admin'});
    
    let filters = {};

    let cuDate = new Date();
    cuDate.setHours(0, 0, 0, 0);

    let start = req.body.start ? new Date(req.body.start) : '.js';
    let end = req.body.end ? new Date(req.body.end) : '.js';
    let username = req.body.username;
    let amount = req.body.amount;
    let upiOrAccount = '.js';
    let paymentstatus = req.body.status;

    if(amount) {
      filters.amount = amount;
    }

    if(paymentstatus || paymentstatus == 0) {
      filters.txn_status = paymentstatus;
    }
    
    let userId = '.js';
    if( username ) {
      let selectUser = await User.findOne({
        'username': username
      }, '_id').exec();

      if(selectUser) {
        userId = selectUser.id;
      } else {
        upiOrAccount = username;
      } 
    }

    if(start && end) {
      filters.createdAt = {
        $gte: start.toISOString(),
        $lte: end.toISOString()
     }
    }
     
    
    if ( user.role.id == 2 ) {

      let allChildCheck = await treeUnderUser(user.id);

          if (userId && !allChildCheck.includes(userId)) {

            response.message = 'user does not exist under this agent.js';
            return res.status(500).json({
              'message': 'user not found'
            });
          }

          filters.userid = {$in : allChildCheck}

    } else if (user.role.id == 3){
      filters.userid = user.id;
    } else if(userId){

      filters.userid = userId;

     
    }

    if(!req.body.start && !req.body.end && (userId || amount)) {
        delete filters.createdAt;
    }

    
    let perPage = 100, page = 0;

    if( req.body.currentPage ) {
      page = parseInt(req.body.currentPage)
    }

   filters.type = {$eq: 'WITHDRAW'};

   if(upiOrAccount) {
    filters.$or = [{"paymentDetails.upi" : upiOrAccount},{"paymentDetails.account" : upiOrAccount}];
   }
   
  let payments = await Payment.find(filters).limit(perPage).skip(page * perPage).sort({
      _id: 'desc'
    }).populate('userid', 'username name').exec();
  
   
    response.payments = payments;
    response.status = 1;
    response.message = 'Get payments.js';
    res.status(response.status == 1 ? 200 : 500 ).json(response);

  } catch (err) {
    response.status = 0;
    response.message = err.message || err.toString(); 
    res.status(500).json(response);
  }
});

router.post('/update/:id', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'updatePaymentWithdraw');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in set payment status." 
  };
  
 // Start from 
  let midorderid = req.params.id;
  let txn_status = req.body.txn_status;
  let reason = req.body.reason;
  
  
  if( !midorderid ) {
    response.message = "Please provide order id.";
    return res.status(500).json(response);
  }

  if( !txn_status ) {
    response.message = "Please provide txn_status.";
    return res.status(500).json(response);
  }


  
  try {
    let payment = await Payment.findOne({ _id: ObjectId(midorderid) }).populate('userid').exec();
   
    if(!payment) {
      
      response.message = "We do not find any payment with this ID.";
      return res.status(500).json(response);
    }

    if(reason) {
      payment.reason = reason;
    }

    if( payment.type == 'ADD') {
      if( !req.body.amount ) {
        response.message = "Please provide amount.";
        return res.status(500).json(response);
      }
  
      payment.amount = req.body.amount;
  
    }

    if(payment.txn_status == 2 && txn_status == 2) {
      response.message = "Transaction is already success.";
      return res.status(500).json(response);
    }

    
    if( txn_status == 1 || txn_status == 2 ) {
      payment.txn_status = txn_status;

      if(payment.type == 'ADD' || txn_status == 1) {
        let txnTime = new Date();
        payment.txn_time = txnTime.toISOString();
        await payment.save();
      }
    }

    if(txn_status == 0) {
      payment.txn_status = txn_status;
      await payment.save();
    }

    
    
    
    if( payment.txn_status == 2 &&  payment.type == 'ADD') {
      
      payment.userid.coins += payment.amount;
      
      
      // Admin id
      let toUser = payment.userid.id;
      let trans_coins = payment.amount;
      
      let comment = 'Online Payment txn ' + payment.paymentTxn;

      if( payment.paymentType == 'offline') {
        comment = 'Offline Payment txn ' + payment.paymentTxn;
        payment.userid.cashflow.offline_add_coins += payment.amount;
        
      } else {
        payment.userid.cashflow.online_add_coins += payment.amount;
      }

      payment.userid = await markAsPrimeUser(payment.userid);

      // Get admin details
      let fromUser = await User.findById('61160d8e90f4c31eb5433773').exec();

      
    await Transaction.create({
      type: "ADD",
      toUser: ObjectId(toUser),
      fromUser: ObjectId(fromUser.id),
      trans_coins: trans_coins,
      comment: comment,
      payment: payment.id,
      remaining_coins: payment.userid.coins
  });

  let amountForCashback = payment.amount;
      if(payment.amount > 9999) {
        amountForCashback = 10000;
      }

  let amountFind = await AmountOption.findOne({'amount' : amountForCashback});

  let cashback = 0;
  if(amountFind) {
    if(amountFind.cashback) {

      cashback = (payment.amount * (amountFind.cashback/100));
      payment.userid.coins += cashback;
      
      await Transaction.create({
        type: "ADD",
        toUser: ObjectId(toUser),
        fromUser: ObjectId(fromUser.id),
        trans_coins: cashback,
        comment: 'cashback',
        payment: payment.id,
        remaining_coins: payment.userid.coins
    });

    }
  }

  fromUser.coins = fromUser.coins - trans_coins;  
  
  if(cashback) {
    fromUser.coins = fromUser.coins - cashback;
    payment.userid.cashflow.bonus_coins += cashback;
    
  }

  await fromUser.save();
  
  payment.userid.lockedmoney = payment.userid.lockedmoney + (trans_coins * 1) + cashback;
  await payment.userid.save();

      response.status = 1;
      response.message = 'Payment status has been updated..js';

    } else if(payment.txn_status == 2 &&  payment.type == 'WITHDRAW' ) {
     
      payment.txn_status = 2;
      payment.paymentTxn = req.body.transaction_id == undefined ? '' : req.body.transaction_id;
      let txnTime = new Date();
      payment.txn_time = txnTime.toISOString();

      payment.userid.cashflow.withdraw += payment.amount;
      await payment.userid.save();
      await payment.save();

      

      response.status = 1;
      response.message = 'Withdraw has been processed..js';

      // Todo: For autowithdraw 
      /*let paymentUrl = await Setting.findOne({name : 'teempatti_payment_website'});
      let url = paymentUrl.value + '/wp-content/plugins/razorpay/payout.php.js';

      let parms = {};

      let upi = payment.paymentDetails['upi'] != undefined ? payment.paymentDetails['upi'] : '.js';

      parms.name = payment.userid.name;

      if(upi) {
        parms.upi = upi;
      } else {
        let account = payment.paymentDetails['account'] != undefined ? payment.paymentDetails['account'] : '.js';
        parms.account = account;

        let ifsc = payment.paymentDetails['ifsc'] != undefined ? payment.paymentDetails['ifsc'] : '.js';
        parms.ifsc = ifsc;

        let name = payment.paymentDetails['name'] != undefined ? payment.paymentDetails['name'] : '.js';
        if(name) {
          parms.name = name;
        }
      }

      
      parms.phone = payment.userid.phone;
      parms.amount = payment.amount;

      let resp = await axios.post(url, parms);
      console.log(resp);
      
      if(resp) {
        let dateResponse = resp.data;


        if(dateResponse['error']['code'] != 'NA') {
          // TODO logs error and return ;
         response.message = dateResponse['error']['reason'];
         logger.error(response.message, {metadata:dateResponse });
         
      payment.txn_status = 1;
      payment.paymentTxn = dateResponse['id'] != undefined ? dateResponse['id'] : '.js';
      let txnTime = new Date();
      payment.txn_time = txnTime.toISOString();
      await payment.save();
      
      return res.status(500).json(response);
         
        } else if(dateResponse['id'] != undefined ) {
        
          payment.txn_status = 2;
          payment.paymentTxn = dateResponse['id'];
          let txnTime = new Date();
          payment.txn_time = txnTime.toISOString();
          await payment.save();
          
          response.status = 1;
          response.message = 'Payment is in ' + dateResponse['status']; 
          logger.error(response.message, {metadata:dateResponse });

        }
 
      } else {

      response.status = 0;
      response.message = 'Issue in withdraw request http error..js';
      
      } */
    }

    if(!response.status) {
      logger.error(response.message, {metadata:response });
    }

    if(txn_status != 3) {
      response.status = 1;
    }
 
    return res.status(response.status == 1  ? 200 : 500 ).json(response);

  } catch (err) {
    response.status = 0;
      response.message =  err.message || err.toString()
      logger.error(response.message, {metadata: err}); 
      res.status(500).json(response);
  }
});

// Add withdraw
router.post('/withdraw', requireJwtAuth, async (req, res) => {

  let authstatus = await verifyToken(req);
  if (authstatus.status == 0) {
    return res.status(403).json(authstatus);
  }

  let permission = await checkpermission(req.user.role.id, 'createWithdraw');
  if (permission.status == 0) {
    return res.status(403).json(permission);
  }

  // To do default response
  let response = {
    "status": 0,
    "message": "Issue to add withdraw proccess." 
  };

  try {

    let userid = req.user.id;
    
    let start = new Date();
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);

    let filters = {};
    
    filters.createdAt = {
      $gte: start.toISOString(),
      $lte: end.toISOString()
    }

    filters.userid = ObjectId(userid);

    filters.type = {$eq: 'WITHDRAW'};

   let totalWidthDraw = await Payment.find(filters);

   if(totalWidthDraw.length > 1) {
     response.message = 'We have allowed 2 withdraws on daliy bases.'
     return res.status(500).json(response);
   }

   let amount = parseInt(req.body.amount);
   let paymentDetails = req.body.paymentDetails;

   // Temp comment for 10k
  //  if( amount > 10000 ) {
  //   response.message = 'We have allowed max 10k amount per withdraw.'
  //   return res.status(500).json(response);
  // }

    if( !userid ) {
      response.message = "Please provide user details.";
      return res.status(500).json(response);
  }

  if( !amount ) {
    response.message = "Please provide amount details.";
    return res.status(500).json(response);
  }

  if(amount < 1) {
    response.message = "Please provide amount details.";
    return res.status(500).json(response);
  }

  let user = await User.findById({_id:userid}).exec();

  if( !user ) {
    response.message = "Wrong user given.";
    return res.status(500).json(response);
  }

    if( paymentDetails.upi != undefined  && paymentDetails.upi) {
     let checkUpiAlreadyConnected = await User.findOne({'upi':paymentDetails.upi, _id:{$ne: userid }}); 
      if(checkUpiAlreadyConnected) {
        response.message = paymentDetails.upi + ' upi is connected with other account.'
     return res.status(500).json(response);
      } else {
        user.upi = paymentDetails.upi;
      }
    }

    if( paymentDetails.account != undefined  && paymentDetails.account) {
      let checkUpiAlreadyConnected = await User.findOne({'account':paymentDetails.account, _id:{$ne: userid }}); 
       if(checkUpiAlreadyConnected) {
         response.message = paymentDetails.account + ' account is connected with other account.'
      return res.status(500).json(response);
       } else {
        user.account = paymentDetails.account;
       }
     }

    
    
    

    

    let maximumWithdrawAmount = user.coins - user.lockedmoney;
    
    if( amount > maximumWithdrawAmount ) {
      response.message = "Your maximum withdrawal amount is " + maximumWithdrawAmount;
      return res.status(500).json(response);
    }

    // Deduct coins from 
    user.coins = user.coins - amount; 

    // Check user has this much coins
    if(user.coins < 0) {
      response.message = "Do not have this much coins to withdraw.";
      return res.status(500).json(response);
    }

    await user.save();
    

    

    // Get admin details
    let adminUser = await User.findById('61160d8e90f4c31eb5433773').exec();

    //let paymentUrl = await Setting.findOne({name : 'teempatti_payment_website'});
    
// Add payment
    let payment = await Payment.create({
      'userid' : userid,
      'amount':amount,
      'paymentDetails' : paymentDetails,
      'type':'WITHDRAW',
      'txn_status' : 0
  });

  adminUser.coins = adminUser.coins + amount;
  await adminUser.save();

  if(payment) {
    let comment = 'Withdraw Request.js';
    
   await Transaction.create({
      type: "SUBTRACT",
      toUser: ObjectId(adminUser.id),
      fromUser: user.id,
      trans_coins: amount,
      comment: comment,
      payment:payment.id,
      remaining_coins: user.coins
  });

    // Customer create proccess
    // response.data = {
    //   "transaction_id": payment.id,
    //   "amount" : amount,
    //   "firstName" : user.name,
    //   "email": user?.email,
    //   "phone": user?.phone,
    //   "url" : paymentUrl.value + '/wp-content/plugins/razorpay/checkout.php'
    // };

    response.coins = user.coins
    response.status = 1;
    response.message = 'Withdraw has been processed. Amount will be transfer according to your payment information..js';
    
  }

  return res.status(response.status == 1 ? 200 : 500).json(response);
  
  } catch (err) {

      response.status = 0;
      response.message =  err.message || err.toString()
      logger.error(response.message, {metadata: err}); 
      return res.status(500).json(response);
  
  }
});


export default router;
