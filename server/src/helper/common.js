import Setting from "../models/Setting.js";
import GameHistory from "../models/GameHistory.js";
import User from "../models/User.js";
import 'dotenv';
import Game from "../models/Game.js";
import {generate} from 'referral-codes';
//import Promise from 'promise.js';
import {
  response
} from "express";
import Payment from "../models/Payment.js";

import Room from "../models/Room.js";
import PlayingData from "../models/PlayingData.js";
import Betting from "../models/Betting.js";
// import { single } from "joi/lib/types/array.js";
import BoatActivity from "../models/BoatActivity.js";
// import {callChaal,callPack,cardSeen, removePlayerFromRoom, sideShowStatus} from '../controllers/teenpatti.js';
import GameConnectBoat from "../models/GameConnectBoat.js";
import Token from "../models/Token.js";
import BettingType from "../models/BettingType.js"
import {createBetWithUpdate} from "../controllers/bettings.js";
import mongoose from "mongoose";

const env = process.env;
const ObjectId = mongoose.Types.ObjectId;

export const settingsData = async (name = '') => {

  try {
    let settings = await Setting.find({}, 'name value').sort({
      orderby: 'asc'
    }).exec();

    let allSettings = {};

    settings.forEach(function (element) {
      allSettings[element.name] = element.value;
    });

    allSettings.ROLLETE_GAME_TIME = env.ROLLETE_GAME_TIME;
    allSettings.GAME_GAP = env.GAME_GAP;
    allSettings.BETTING_INTERVAL_TIME = env.BETTING_INTERVAL_TIME;
    allSettings.ROLLETE_GAME_ID = env.ROLLETE_GAME_ID;

    allSettings.LuckyCard_Total_Game_Time = env.LuckyCard_Total_Game_Time;
    allSettings.LuckyCard_Timer_Time = env.LuckyCard_Timer_Time;
    allSettings.LuckyCard_Wait_Time = env.LuckyCard_Wait_Time;
    allSettings.LuckyCard_Stop_Bet = env.LuckyCard_Stop_Bet;
    allSettings.Lucky_Card_GAME_ID = env.Lucky_Card_GAME_ID;

    allSettings.JH_GAME_ID = env.JH_GAME_ID;
    allSettings.JH_TOTAL_GAME_TIME = env.JH_TOTAL_GAME_TIME;
    allSettings.JH_TIMER_TIME = env.JH_TIMER_TIME;
    allSettings.JH_WAIT_TIME = env.JH_WAIT_TIME;
    allSettings.TICKET_ID = env.TICKET_ID;
    allSettings.PRINT_LC = env.PRINT_LC;

    allSettings.CARDSFIFTYTWO_GAME_ID = env.CARDSFIFTYTWO_GAME_ID;
    allSettings.CARDSFIFTYTWO_Total_Game_Time = env.CARDSFIFTYTWO_Total_Game_Time;
    allSettings.CARDSFIFTYTWO_Timer_Time = env.CARDSFIFTYTWO_Timer_Time;
    allSettings.CARDSFIFTYTWO_Wait_Time = env.CARDSFIFTYTWO_Wait_Time;
    allSettings.CARDSFIFTYTWO_Stop_Bet = env.CARDSFIFTYTWO_Stop_Bet;

    allSettings.TRIPLE_CHANCE_GAME_ID = env.TRIPLE_CHANCE_GAME_ID;
    allSettings.TRIPLE_CHANCE_Total_Game_Time = env.TRIPLE_CHANCE_Total_Game_Time;
    allSettings.TRIPLE_CHANCE_Timer_Time = env.TRIPLE_CHANCE_Timer_Time;
    allSettings.TRIPLE_CHANCE_Wait_Time = env.TRIPLE_CHANCE_Wait_Time;
    allSettings.TRIPLE_CHANCE_Stop_Bet = env.TRIPLE_CHANCE_Stop_Bet;

    allSettings.SPIN_TO_WIN_GAME_ID = env.SPIN_TO_WIN_GAME_ID;
    allSettings.SPIN_TO_WIN_Total_Game_Time = env.SPIN_TO_WIN_Total_Game_Time;
    allSettings.SPIN_TO_WIN_Timer_Time = env.SPIN_TO_WIN_Timer_Time;
    allSettings.SPIN_TO_WIN_Wait_Time = env.SPIN_TO_WIN_Wait_Time;
    allSettings.SPIN_TO_WIN_Stop_Bet = env.SPIN_TO_WIN_Stop_Bet;

    allSettings.DRAGON_VS_TIGER_ID = env.DRAGON_VS_TIGER_ID;
    allSettings.DRAGON_VS_TIGER_Total_Game_Time = env.DRAGON_VS_TIGER_Total_Game_Time;
    allSettings.DRAGON_VS_TIGER_Timer_Time = env.DRAGON_VS_TIGER_Timer_Time;
    allSettings.DRAGON_VS_TIGER_Wait_Time = env.DRAGON_VS_TIGER_Wait_Time;
    allSettings.DRAGON_VS_TIGER_Stop_Bet = env.DRAGON_VS_TIGER_Stop_Bet;
    allSettings.DRAGON_VS_TIGER_betting_stop = env.DRAGON_VS_TIGER_betting_stop;
    allSettings.DRAGON_VS_TIGER_game_gap = env.DRAGON_VS_TIGER_game_gap;

    if (name) {
      allSettings = allSettings[name];
    }

    return allSettings;
  } catch (err) {}
}

export const bettingAlowedGame = async (gameId) => {

  let d = new Date();

  let gameHistory = await GameHistory.find({
    start: {
      $lte: d.toISOString()
    },
    betting_allow_time: {
      $gt: d.toISOString()
    },
    game: ObjectId(gameId),
  }).exec();


  return gameHistory;
}

export const crGame = async (gameId) => {

  let d = new Date();

  let gameHistory = await GameHistory.findOne({
    'start': {
      $lte: d.toISOString()
    },
    'end': {
      $gt: d.toISOString()
    },
    game: ObjectId(gameId)
  }, {
    number: 0
  }).exec();


  return gameHistory;
}

export const verifyToken = async (req) => {

  
  let headers = req.headers;
  let token = '.js';
  
// let ar = [0,2000,500,1000,800,1200,1500,1800];
//  await new Promise(resolve => setTimeout(resolve, ar[Math.floor(Math.random() * ar.length)]));

  let response = {
    status: 1,
    message: '',
  };


  if (headers) {
    token = headers['x-auth-token'];
  }

  if (token != req.user.token) {

    response.status = 0;

    response.message = "Unauthorised access";
  }

  return response;
}

export const treeUnderUser = async (agentId) => {

  let allChld = [];

  let crntCheckChild = [agentId];

  let runningLoop = 1;

  while (runningLoop) {
    let newChild = await User.find({
      parent: {
        $in: crntCheckChild
      }
    }).exec();

    if (newChild.length == 0) {
      runningLoop = 0;
      break;
    }

    crntCheckChild = newChild.map(function (a) {
      return a.id;
    });
    allChld = [...allChld, ...crntCheckChild];
  }

  return allChld;
}

export const checkpermission = async (roleId, action) => {

  let permission = {};

  // user
  permission.addUser = [1, 2];
  permission.userList = [1, 2];
  permission.editUser = [1, 2, 3];
  permission.usercoins = [1, 2, 3];
  permission.byrole = [1, 2];
  permission.userMe = [1, 3, 2];
  permission.inactiveUser = [1];
  //betting
  permission.addBet = [3];
  permission.editBet = [3];
  permission.betList = [1, 2, 3];
  permission.bettingsbyuser = [1, 2];
  permission.turnover = [1, 2, 3];
  permission.userturnover = [3]

  //betting types
  permission.addtypes = [1];
  permission.editTypes = [1];
  permission.getTypes = [1, 2, 3];

  //GameHistory
  permission.getHistoryList = [1, 2, 3];
  permission.gameHistory = [1, 2, 3];
  permission.getNumber = [1, 2, 3];
  permission.last10Num = [1, 2, 3];
  permission.drawNumber = [1];
  permission.drawJackpot = [1];
  permission.delGameHis = [1];
  permission.currentgame = [1, 2, 3];
  permission.todaytotal = [1, 2, 3];
  permission.crgamelist = [1, 2, 3];
  //settings
  permission.getSettings = [1, 2, 3];
  permission.editSettings = [1];

  //Transactions
  permission.listTrans = [1, 2, 3];


  permission.listUserTrans = [1, 2, 3];

  //Game
  permission.editGame = [1];
  permission.listGame = [1, 2, 3];

  //Token
  permission.editToken = [1];
  permission.listToken = [1, 2, 3];


  //role
  permission.listRoles = [1];
  permission.wallet = [1, 2];
  permission.listlockeddevices = [1];
  permission.deletedevices = [1];


  permission.setCommission = [1, 2];
  permission.gameData = [1, 2];
  permission.getWinners = [1];
  permission.dashboard = [1];
  permission.cashback = [1];
  permission.dealertip = [1];
  permission.resetlockedmoney = [1];
  permission.boatlist = [1];
  permission.addboat = [1];
  permission.currentteenpatti = [1];
  permission.graphfilter = [1];

  permission.createOfflinePayment = [3];
  permission.listOfPayment = [1,4];
  permission.listOfWithdraw = [1,4];
  permission.updatePaymentWithdraw = [1,4];
  permission.createWithdraw = [3];

  let response = {
    'status': 0,
    'message': 'Access denied'
  };
  if (action && permission[action] !== undefined) {
    if (permission[action].indexOf(roleId) !== -1) {
      response.status = 1;
      response.message = '.js';
    }
  }

  return response;
}

export const getAllGames = async () => {
  let games =  await Game.find({},'id').exec();

  let gameList = [];
  for (const singleGame of games) {
    gameList.push(singleGame.id);
  }

  return gameList;
}

export const getDisplayId = async () => {
  let startingIndex = 1000;
  let lastUser = await User.findOne({},'id displayid').sort({'createdAt':-1});

  let lastdisplay = startingIndex + 1;
  if(lastUser) {
    if(lastUser.displayid > 0) {
      lastdisplay = lastUser.displayid + 1;
    } 
  }

  let checkUserAlreadyExists = await User.findOne({displayid: lastdisplay});

  while(checkUserAlreadyExists) {
    lastdisplay = lastdisplay + 1;
    checkUserAlreadyExists = await User.findOne({displayid: lastdisplay});
  }

  return lastdisplay;
}

export const generateReferCode = async () => {

let referUserCode;

let loop = 1;

// Genrate code 
while( loop ) {

  // Genrate code
 referUserCode = await generate({
  length: 5,
  count: 1,
  charset: '0123456789abcdefghijklmnopqrstuvwxyz',
}); 

  let user = await User.findOne({refer_code:referUserCode[0]}).exec();

if(!user) {
  loop = 0
}

}



return referUserCode[0];
}

/**
 * Mark as Prime
 * @param {*} checkingUser -  User object
 * 
 */
export const markAsPrimeUser = async (checkingUser) => {

  let totalSum = checkingUser.cashflow.offline_add_coins + checkingUser.cashflow.online_add_coins;

  if(totalSum > 99) {
    checkingUser.prime = true;
  }

  return checkingUser;
}

export const canUserUploadScreenShort = async (req,res, next) => {
 
  let response = {
    "status": 0,
    "message": "Issue in payment proccess." 
  };
  
  try {

    let start = new Date();
    start.setHours(0, 0, 0, 0);

    
    let end = new Date();

    let previousPayments = await Payment.findOne({'userid':req.user.id,'txn_status':0, 
    createdAt : { $gte: start.toString(), $lte: end.toString()}});

    if(previousPayments) {
      response.message = 'You payment is underprocess.'
      return res.status(500).json(response);
    }

    previousPayments = await Payment.find({'userid':req.user.id,'txn_status':1, 
    createdAt : { $gte: start.toString(), $lte: end.toString()}});

    if(previousPayments.length > 4) {
      req.user.status = false;
      req.user.token = '.js';
      await req.user.save();

      response.message = 'Continues failed screenshort uploaded.'
      return res.status(500).json(response);
    }
  return next();
    
  } catch (error) {

    logger.error(err.message, {metadata: err});
    return res.status(500).json({
      message: err.Message,
      status: 0
    });
  }
}

export const allCurrentGames = async () => {

  let d = new Date();

  let gamesInCurrentTime = await GameHistory.find({
    'start': {
      $lte: d.toISOString()
    },
    'end': {
      $gt: d.toISOString()
    }
  }, {
    number: 0,
  }).exec();

  return gamesInCurrentTime;
}

export const autoBettingsByBoat = async (gameId) => {
  
  // Todo: Vikram
     // Select enable tokens for every game
     // random taken token from above tokens
     // Take total tokens as amount
     // Save that amount fakeNumberBetting 

     try {
let d = new Date();

d.setSeconds(d.getSeconds() + 1);
   
     let gameHistory = await GameHistory.findOne({
       start: {
         $lte: d.toISOString()
       },
       betting_allow_time: {
         $gt: d.toISOString()
       },
       game: ObjectId(gameId),
     },{id : 1}).exec();

     console.log(gameHistory);
if(!gameHistory) {
 return 1;
}

let enableTokens = await Token.find({notAllowedGames: {$nin: [ObjectId(gameId)]}},{'coins' : 1});
let bettingTypes = await BettingType.aggregate([
 { $match: { game: ObjectId(gameId)}}, { $sample: { size: 10 } }]);

let boatUser = await GameConnectBoat.findOne({gameid:gameId});

if(!boatUser) {
  return 1;
}

let numbers = [];
if( gameId == env.DRAGON_VS_TIGER_ID ) {
 numbers = [1,2,3];
} else if(env.Lucky_Card_GAME_ID == gameId) {
 numbers = [1,2,3,4,5,6,7,8,9,10,11,12];
}

let coinsQtyList = {
 1000 : {
   min : 2,
   max : 5
 },
 500:{
   min: 3,
   max: 8
 },
 200:{
   min: 4,
   max: 9
 },
 100 : {
   min: 8,
   max: 15,
 },
 50: {
   min: 10,
   max: 20,
 },
 20 : {
   min: 8,
   max: 15,

 },
 10: {
   min: 20,
   max: 35
 },
 5: {
   min: 80,
   max: 40,
 },
 1 : {
   min: 100,
   max: 70 
 }

}

let qty = 0;
let amount = 0;
let responseBets = [],responseBet = {};

let betting,createUpdateAr = [];
let counter = 0;
for (const singleType of bettingTypes) {
 
   betting = {};
   
   betting.numbers = [];
   betting.betting_type = singleType._id;
   betting.name = "Auto";
   betting.game = gameId;
   betting.game_history = gameHistory.id;

   for(let i = 0  ; i < singleType.count ; i++ ) {

     if( gameId == env.DRAGON_VS_TIGER_ID ) {  
       betting.numbers.push(numbers[counter]);
       counter++;  
     } else {
       betting.numbers.push(numbers[Math.floor(Math.random() * numbers.length)]);
     }
     
   }
   
   betting.amount = 0;
   responseBet = {};
   let tokensOnBet = {};

   for (const singleToken of enableTokens) {
     let min = !!coinsQtyList[singleToken.coins].min ? coinsQtyList[singleToken.coins].min : 10;
     qty = Math.floor(Math.random() * ((!!coinsQtyList[singleToken.coins].max ? coinsQtyList[singleToken.coins].max : 25)   - min + 1) + min);
     
     if( gameId == env.DRAGON_VS_TIGER_ID ) {  
       if( betting.numbers[0] == 2 ) {
         qty = parseInt(qty/2);
       }
     }

     betting.amount += singleToken.coins * qty
     amount += singleToken.coins * qty;

     betting.tokens = [];

     if(singleToken.coins in betting.tokens) {
       betting.tokens[singleToken.coins] += qty;
 tokensOnBet[singleToken.coins] += qty;
     } else {
 tokensOnBet[singleToken.coins] = qty;
       betting.tokens[singleToken.coins] = qty;
     }
     
   }

   betting.winning = singleType.winning_x * betting.amount;
   betting.localid = 0;
   betting.win_status = false;
   betting.status = 'completed.js';
   betting.user = boatUser.userid;
   betting.byBoat = true;


   //betting
   createUpdateAr.push(betting);

   
   responseBets.push(
     {
       'tokens' : tokensOnBet,
       'numbers' : betting.numbers,
       'betting_type': singleType._id
     }
   );
 
}

if(createUpdateAr.length) {

 await Betting.insertMany(createUpdateAr);
 
}

return responseBets;

} catch (err) {
 console.log(err);
 logger.error(err.message, {metadata: err});
//  response.message = err.message || err.toString();
 return callback(JSON.stringify({message : err.message || err.toString(), status : 0}));
}



}

const delay = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const ParseFloat = (str,val = 2) =>  {
  return parseFloating(str,val);
}


const parseFloating = (str, val = 2 ) => {

 if( !Number.isInteger(str)) {
  str = str.toString();
  str = str.slice(0, (str.indexOf(".")) + val + 1); 
 }
 
 return Number(str); 
}

// export const createTransaction = async (gameId) => {
// // Add wallet amount
// if(userBets[userBetKey]['winamount'] > 0) {
    
//   winners.push(userBetKey);

//   let day = new Date();

//   if (user.play_point_update == day.getDay()) {
//     user.daily_winning_points += userBets[userBetKey]['winamount']; 

//   } else {
//     user.daily_winning_points = userBets[userBetKey]['winamount'];
//   }

//   user.winning += userBets[userBetKey]['winamount'];

//   let winAm = (userBets[userBetKey]['winamount'] * 0.9);
//   user.coins += winAm;
//   await user.save();

//   transactionData.push ( {
//       type: "ADD",
//       toUser: userBetKey,
//       game_history_id: userBets[userBetKey]['game_history'],
//       game_id: userBets[userBetKey]['game'],
//       trans_coins: winAm,
//       comment: 'Add for winning ' + game,
//       remaining_coins: user.coins
//   });

//   //let winAmountTransfer = await updateWallet('ADD', 0, userBetKey, 0, userBets[userBetKey]['winamount'], userBets[userBetKey]['game_history'], userBets[userBetKey]['game'], 'Transfer for betting win',function(resp){
//    // return resp;
//   //});

// }

// }

// if(transactionData.length) {
// await Transaction.insertMany(transactionData);
// }



//     let game_total_winning = numberDocument.wincoins_if_draw_this_number;

//     if (gameHistory.jackpot) {
//       game_total_winning = (numberDocument.wincoins_if_draw_this_number * gameHistory.jackpot);
//     }

//     let gameHisUpdate = await GameHistory.updateOne({
//       _id: gameHistory._id
//     }, {
//       winners: winners,
//       total_winning: game_total_winning
//     });
//   }
// }


export const triggerOnGameStart = async (gameId) => {

  let gameHistory = await GameHistory.findOne({
    game: ObjectId(gameId),
  }).sort({_id:-1}).skip(1).limit(1).exec();

  return gameHistory;
}