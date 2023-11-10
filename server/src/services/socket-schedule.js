import NumberBettingHistory from '../models/NumberBettingHistory.js';
import GameHistory from '../models/GameHistory.js';
import TambolaGameHistory from '../models/TambolaGameHistory.js';
import TambolaGameTicket from '../models/TambolaGameTicket.js';
import TambolaTicket from '../models/TambolaTickets.js';
import Room from '../models/Room.js';
import {
  settingsData,
  bettingAlowedGame,crGame,allCurrentGames,triggerOnGameStart,teenPattiWalletAndBetting, teenPattiActiveBoats, performActivity,ParseFloat, getBoatUsersForGame
, autoBettingsByBoat } from '../helper/common.js';
import Betting from '../models/Betting.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import BoatUser from '../models/BoatUser.js';
import BoatBetting from '../models/BoatBetting.js';
import PlayingData from "../models/PlayingData";
import {playerPacked, resetRoomGame,startTimerOnNextTurn,cardSeen} from '../controllers/teenpatti.js';
import {getLiveFutureGame, getFutureGameDates}  from '../controllers/tambola.js';


import 'dotenv';
import Boot from '../models/Boot.js';
import GameConnectBoat from '../models/GameConnectBoat.js';
const env = process.env;
const schedule = require('node-schedule');
const ObjectId = require('mongoose').Types.ObjectId;


let logger = require('./logger');
var socketObject;
let delayForCardPass = 10;
let bettingTime = 10;

export const ioObject = (io) => {
  socketObject = io;

}



let lcDrawNumber = 1;
let rouletteDrawNumber = 1;
let cards52DrawNumber = 1;
let tripleChanceDrawNumber = 1;
let spinToWin = 1;
let dragonvsTiger = 1;
let teenPattiStart = 1;
let tambolaGameId = '64410e6ed3a7eca8ad628ff3.js';

// Tambola game scheduler
// Game starter trigger
// number draw
const fiveSecondJob = schedule.scheduleJob('*/5 * * * * *', async () => {

  try {
    console.log('checking');
    
    let tambolaGamesNumberUpdated = await TambolaGameHistory.find({updateNumber:true }).populate('rewards._id').populate({
      path : 'rewards.ticketids',
      populate : {
        path: 'userid'
      }
    });

    console.log(tambolaGamesNumberUpdated);

    let upReso = await TambolaGameHistory.updateMany({updateNumber:true },{$set : {updateNumber:false}});
    
    let numberDrawObj = {};
    let numberJackPotList = {}; 
    
    if(tambolaGamesNumberUpdated.length) {
  
      for (const singleGame of tambolaGamesNumberUpdated) {
        
        if(singleGame.numbers.length) {
          numberDrawObj[singleGame.gameHistory] = {
            dwrNumber : singleGame.numbers[singleGame.numbers.length - 1],
            gameid : singleGame.gameHistory,
            numbers : singleGame.numbers,
            rewards: singleGame.rewards
          }
        } else {

          if(singleGame.jackpotNumber) {
            numberJackPotList[singleGame.gameHistory] = {
              dwrNumber : singleGame.jackpotNumber,
              gameid : singleGame.gameHistory,
            }
          }
         
        }
        
      }
      console.log(numberDrawObj);
      console.log(numberJackPotList);
      socketObject.emit('tambolaDrawNumber', JSON.stringify(numberDrawObj));
      socketObject.emit('tambolaJackPotNumber', JSON.stringify(numberJackPotList));
    }
    
  } catch (err) {
    logger.error(err.message, {metadata: err});
  }
  

});

const second30Job = schedule.scheduleJob('*/30 * * * * *', async () => {

  try {
    //TambolaGameHistory
    let tambolaGamesNumberUpdated = await TambolaGameHistory.find({pendingTransaction:true })
    .populate('rewards._id').populate({
      path: 'rewards.ticketids',
      populate: {
        path: 'userid',
        model: 'User'
      }
    });
    
    TambolaGameHistory.updateMany({pendingTransaction:true },{$set : {pendingTransaction:false}});
  
    if(tambolaGamesNumberUpdated.length) {
  
      let multipleTransactionsData = [];
      let day = new Date();
      let usersList = [];
      let jackPotWinners = []

      for (const singleGame of tambolaGamesNumberUpdated) {
       
        jackPotWinners = [];

        for (const singleReward of singleGame.rewards) {

          if(!singleReward.status) {
            continue;
          }
          
          let givenAmountPerUser =  parseInt(singleReward.prize / singleReward.ticketids.length);

          
          for (const singleTicket of singleReward.ticketids) {

            if(!singleTicket.userid) {
              continue;
            }
            let user = singleTicket.userid;
            
            usersList.push(user._id);
            user.coins = user.coins + givenAmountPerUser;

            if(singleReward.isJackPot) {
              jackPotWinners.push({
                user: user,
                ticketid : singleTicket.ticketid
              });
            }
  
            if (user.play_point_update == day.getDay()) {
              user.daily_winning_points += givenAmountPerUser; 
         
            } else {
              user.daily_winning_points = givenAmountPerUser;
            }
        
            user.winning += givenAmountPerUser;
  
            await user.save();
  
            multipleTransactionsData.push({
              type: "ADD",
              toUser: user._id,
              game_history_id: singleGame.gameHistory,
              game_id: ObjectId(tambolaGameId),
              trans_coins: givenAmountPerUser,
              comment: `Add for winning  ${singleReward._id.name}  tambola game id ${(singleGame._id).toString().slice(-6)}`,
              remaining_coins: user.coins
          });
          }
        }

        if(jackPotWinners.length) {
          let amountdivPerPerson =  parseInt(singleGame.jackpotPrice / jackPotWinners.length);
          for (const singleWinner of jackPotWinners) {
            singleWinner.user.coins = singleWinner.user.coins + amountdivPerPerson;
            multipleTransactionsData.push({
              type: "ADD",
              toUser: singleWinner.user._id,
              game_history_id: singleGame.gameHistory,
              game_id: ObjectId(tambolaGameId),
              trans_coins: amountdivPerPerson,
              comment: `Add for jackpot winning  ${singleWinner.ticketid}  tambola game id ${(singleGame._id).toString().slice(-6)}`,
              remaining_coins: singleWinner.user.coins
          });

          await singleWinner.user.save();

          }
        }
      }

     

        await Transaction.insertMany(multipleTransactionsData);
        socketObject.emit('tambolaWalletCrNotification', JSON.stringify(usersList));
      
    }
    
  } catch (err) {
    logger.error(err.message, {metadata: err});
    console.log(err);
  }

});

const tenSecondJob = schedule.scheduleJob('*/10 * * * * *', async () => {

  try {

    let cuTimeDt = new Date();

    cuTimeDt.setSeconds(cuTimeDt.getSeconds() - 10);
    
    let checkForNewGame = await TambolaGameHistory.find({updatedAt:{$gte : cuTimeDt.toISOString() }, status:{$ne: false}});
    
    if(checkForNewGame.length){
      let response = await getFutureGameDates();
      socketObject.emit('tambolaNewDateAdded', JSON.stringify(response));
    }
    
  } catch (err) {
    logger.error(err.message, {metadata: err});
  }
  

});


// Every day create loop game
let everyDayJob = schedule.scheduleJob('0 0 * * *', async() => {

  let d = new Date();
  d.setHours(d.getHours() - 24);

  let cu = new Date();
  
  try {

    
    let tambolaGameHistories = await TambolaGameHistory.find({end: {$lt : d.toISOString(), $gt : cu.toISOString()}, loop : {$ne : ''}});

    // Tambola game ID
    let gameId = ObjectId('64410e6ed3a7eca8ad628ff3');

    if(tambolaGameHistories.length) {

      for (const signleGameHis of tambolaGameHistories) {
        
        let startTime = new Date(signleGameHis.start);
  
        if(signleGameHis.loop == 'weekly') {

          startTime.setDate(startTime.getDate() + 6);

      } else if(signleGameHis.loop == 'weekly') {
          
          startTime.setDate(startTime.getDate() - 1);
          startTime.setMonth(startTime.getMonth() + 1);

      }
  
      let betting_allow_time = new Date(startTime);
  
      betting_allow_time.setMinutes(betting_allow_time.getMinutes() - 10);
  
      let gameHis = await GameHistory.create({
        start: startTime.toISOString(),
        total_betting: 0,
        total_winning: 0,
        betting_allow_time: betting_allow_time.toISOString(),
        game: gameId,
        jackpot: 0,
      });
      
      let tickets = await TambolaTicket.find().sort({ ticketid: 1 }).limit(boxes);
      let enteringGameTicket = [];
      for (const signleTicket of tickets) {
        enteringGameTicket.push({
          ticketid: signleTicket.ticketid,
          numbers: [
            signleTicket.C1,
            signleTicket.C2,
            signleTicket.C3,
            signleTicket.C4,
            signleTicket.C5,
            signleTicket.C6,
            signleTicket.C7,
            signleTicket.C8,
            signleTicket.C9,
            signleTicket.C10,
            signleTicket.C11,
            signleTicket.C12,
            signleTicket.C13,
            signleTicket.C14,
            signleTicket.C15,
            signleTicket.C16,
            signleTicket.C17,
            signleTicket.C18,
            signleTicket.C19,
            signleTicket.C20,
            signleTicket.C21,
            signleTicket.C22,
            signleTicket.C23,
            signleTicket.C24,
            signleTicket.C25,
            signleTicket.C26,
            signleTicket.C27,
          ],
          crossed: [],
          gameHistory: gameHis.id,
        });
      }
  
      await TambolaGameTicket.insertMany(enteringGameTicket);
  
      let rewardsIds = [];
  
      if (signleGameHis.rewards) {
        for (let singleReward of signleGameHis.rewards) {
          if (singleReward) {
            singleReward.status = false;
            singleReward.ticketids = [];
            rewardsIds.push(singleReward);
          }
        }
      }
  
  
      // GameHistory
      let tambolaGameHistory = await TambolaGameHistory.create({
        gameHistory: ObjectId(gameHis.id),
        start: startTime.toISOString(),
        name: signleGameHis.name,
        numbers: [],
        jackpotNumber: 0,
        jackpotPrice: signleGameHis.jackpotPrice,
        loop: signleGameHis.loop,
        ticketSet: signleGameHis.ticketSet,
        boxes: signleGameHis.boxes,
        ticketPrice: signleGameHis.ticketPrice,
        rewards: rewardsIds,
        status: signleGameHis.status ? signleGameHis.status : true,
      });
  
    } 
    }

  } catch (err) {
    
    logger.error((err.message || err.toString()), {metadata: err});
    
  }
});

// Temp stop scheduler
if (env.STOP_SCHEDULE != 1 && 0) {

  const oneMinJob = schedule.scheduleJob('*/1 * * * *', async () => {

    let settings = await settingsData();
  
    let luckycard_game_time = settings['LuckyCard_Total_Game_Time'];
    let bettingIntervalTime = settings['LuckyCard_Timer_Time'];
    //let luckycard_game_time = 25;
    //let bettingIntervalTime = 13;
    // let gameGap = 12;
    let gameGap = 15;
  
    let t = new Date();
  
    t.setSeconds(t.getSeconds() + parseInt(gameGap));
    let start = t.toISOString();
  
    
    t.setSeconds(t.getSeconds() + parseInt(bettingIntervalTime));
    let betting_allow_time = t.toISOString();
    
  
    t.setSeconds(t.getSeconds() + parseInt(luckycard_game_time) - parseInt(bettingIntervalTime));
    let end = t.toISOString();
    
  
    let gameId = settings['Lucky_Card_GAME_ID'];
  
    let lastGame = await GameHistory.find({
      game: gameId
    }, 'end').sort({
      end: 'desc'
    }).limit(1).exec();
    if (lastGame.length > 0) {
      let previousGame = lastGame[0];
  
      let lastGameEndTime = new Date(previousGame.end);
      let currentTime = new Date();
  
      let diffInSeconds = (lastGameEndTime - currentTime) / 1000;
  
      if (diffInSeconds > 60) {
        return true;
      }
  
      start = lastGameEndTime.toISOString();
      lastGameEndTime.setSeconds(lastGameEndTime.getSeconds() + parseInt(bettingIntervalTime));
      betting_allow_time = lastGameEndTime.toISOString();
      lastGameEndTime.setSeconds(lastGameEndTime.getSeconds() + parseInt(luckycard_game_time) - parseInt(bettingIntervalTime));
      end = lastGameEndTime.toISOString();
  
      if (diffInSeconds < 0) {
        start = currentTime.toISOString();
  
        currentTime.setSeconds(currentTime.getSeconds() + parseInt(bettingIntervalTime));
        betting_allow_time = currentTime.toISOString();
        currentTime.setSeconds(currentTime.getSeconds() + parseInt(luckycard_game_time) - parseInt(bettingIntervalTime));
        end = currentTime.toISOString();
  
      }
    }
  
    try {
  
      let gameHistory = await GameHistory.create({
        start: start,
        end: end,
        total_betting: 0,
        total_winning: 0,
        betting_allow_time: betting_allow_time,
        game: gameId,
        jackpot: 0,
      });
  
      let insertDocs = [];
      let allNumber = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
      for (let element of allNumber) {
        insertDocs.push({
          number: element,
          game_history_id: gameHistory.id,
          betamount: 0,
          wincoins_if_draw_this_number: 0
        });
      }
  
  
      if (insertDocs) {
        await NumberBettingHistory.insertMany(insertDocs);
      }
  
      // Save one robot
      let gameHis = await triggerOnGameStart(gameId);
  
          if(gameHis) {
      
            let response = {
              'game' : gameHis._id,
            } 
          let enableDisable = parseInt(settings['lucky_card_game_boat']);
          response.boatUsers = [];
          
          if(enableDisable == 1) {
      
            let boatResponse = await getBoatUsersForGame(gameHis.game, 1);
            response.boatUsers = boatResponse;
          }
          socketObject.emit('luckycardgamestart', JSON.stringify(response));
        }
  
    } catch (err) {
      logger.error(err.message, {metadata: err});
    }
  });  
  
  const oneSecondJob = schedule.scheduleJob('*/1 * * * * *', async () => {

    let settings = await settingsData();
	  
    saveBettingAmount(settings['ROLLETE_GAME_ID']);

    saveBettingAmount(settings['Lucky_Card_GAME_ID']);

    saveBettingAmount(settings['SPIN_TO_WIN_GAME_ID']);



    saveBettingAmountLowStorage(settings['TRIPLE_CHANCE_GAME_ID']);

    try {
      saveBettingAmount(settings['CARDSFIFTYTWO_GAME_ID']);
    } catch (err) {
      logger.error(err.message, {metadata: err});
      
    }

    let obj = new NumberBettingHistory();

    if (rouletteDrawNumber == 1) {
      rouletteDrawNumber = 0;
      obj.drawNumber(settings, 'roulette', function (response) {
        rouletteDrawNumber = 1;
        if (response.status == 1) {
          socketObject.emit('roulettewinnumberbroadcast', JSON.stringify(response));
        }
      });
    }

    if (lcDrawNumber == 1) {
      lcDrawNumber = 0;
      obj.drawNumber(settings, 'luckycard', function (response) {
        lcDrawNumber = 1;
        if (response.status == 1) {
          socketObject.emit('luckycardwinnumberbroadcast', JSON.stringify(response));
        }
      });
    }

    if (spinToWin == 1) {
      spinToWin = 0;
      obj.drawNumber(settings, 'spintowin', function (response) {
        spinToWin = 1;
        if (response.status == 1) {
          socketObject.emit('spintowinwinnumberbroadcast', JSON.stringify(response));
        }
      });
    }

    if (cards52DrawNumber == 1) {
      cards52DrawNumber = 0;
      obj.drawNumber(settings, 'card52', function (response) {
        cards52DrawNumber = 1;
        if (response.status == 1) {
          socketObject.emit('card52winnumberbroadcast', JSON.stringify(response));
        }
      });
    }

    if (tripleChanceDrawNumber == 1) {
      
      tripleChanceDrawNumber = 0;
      obj.tripleChance(settings, 'triplechance', function (response) {
        tripleChanceDrawNumber = 1;
        if (response.status == 1) {
          socketObject.emit('tripleChanceNumberbroadcast', JSON.stringify(response));
        }
      }); 
    }

    //


  });

  const updateRandomActiveUsers = async() => {
    let boots = await Boot.find({});
    
    for (let boot of boots) {
      boot.activeUsers = Math.floor(Math.random() * (1500 - 1000 + 1) + 1000);
      await boot.save();
    }
  }

  const twentySecondJob = schedule.scheduleJob('*/20 * * * * *', async () => {

    //////////////////////////Start for Dragon vs Tiger //////////////////////////
    
    try {

    // Update random figure
    //updateRandomActiveUsers();

    let settings = await settingsData();


    
    let gameId = settings['DRAGON_VS_TIGER_ID'];
    
    let dragonGameTime = settings['DRAGON_VS_TIGER_Total_Game_Time'];
    let bettingIntervalTime = settings['DRAGON_VS_TIGER_betting_stop'];
    let gameGap = 20;
    let d = new Date();
    
        d.setSeconds(d.getSeconds() + parseInt(gameGap));
        let start = d.toISOString();
        
    
        d.setSeconds(d.getSeconds() + parseInt(bettingIntervalTime));
        let betting_allow_time = d.toISOString();
        
        d.setSeconds(d.getSeconds() + parseInt(dragonGameTime) - parseInt(bettingIntervalTime));
        let end = d.toISOString();
        
        let gameHistory = await GameHistory.create({
          start: start,
          end: end,
          total_betting: 0,
          total_winning: 0,
          betting_allow_time: betting_allow_time,
          game: gameId,
          jackpot: 0,
        });
    
        let insertDocs = [];
          let allNumber = ["1", "2", "3"];
    
          for (let element of allNumber) {
            insertDocs.push({
              number: element,
              game_history_id: gameHistory.id,
              betamount: 0,
              wincoins_if_draw_this_number: 0
            });
          }
    
    
          if (insertDocs) {
            await NumberBettingHistory.insertMany(insertDocs);
          }
  
          let gameHis = await triggerOnGameStart(gameId);
  
          if(gameHis) {
      
            let response = {
              'game' : gameHis._id,
            } 
          let enableDisable = parseInt(settings['dragon_vs_tiger_game_boat']);
          
          
          response.boatUsers = [];
          
          if(enableDisable == 1) {
      
            let boatResponse = await getBoatUsersForGame(gameHis.game, 1);
            response.boatUsers = boatResponse;
          }

          
          socketObject.emit('dragonvstigergamestart', JSON.stringify(response));
        }  
    
        } catch (err) {
          logger.error(err.message, {metadata: err});
        }
    
    ////////////////////////// End for Dragon vs Tiger //////////////////////////
    
      });


      // Dragon vs tiger counter
    const perSecondsDragonTigerCounter = schedule.scheduleJob('*/1 * * * * *', async () => {

      let currentDragonGame = await crGame(env.DRAGON_VS_TIGER_ID);
      
      if(currentDragonGame) {
        await gameTimeCounterBroadCast('dragon_vs_tiger_time_counter',currentDragonGame.end,env.DRAGON_VS_TIGER_Total_Game_Time,currentDragonGame.id )
      }
    });    

  const perSecondsCounter = schedule.scheduleJob('*/1 * * * * *', async () => {
    let allGames = await allCurrentGames();
    let settings = await settingsData();
  
    // settings['ROLLETE_GAME_ID']
    // settings['Lucky_Card_GAME_ID']
    // settings['CARDSFIFTYTWO_GAME_ID']
    let broadCastName, endTime, totalGameTime;
    
    for (const singleGame of allGames) {
      
      broadCastName = '.js';
      if(singleGame.game == env.ROLLETE_GAME_ID) {
        broadCastName = 'rollete_time_counter.js';
        totalGameTime = env.ROLLETE_GAME_TIME;
       } else if(singleGame.game == env.Lucky_Card_GAME_ID) {

    /*  let enableBoat = parseInt(settings['lucky_card_game_boat']);
    
      if(enableBoat == 1) {
        // using callback

        GameConnectBoat.findOne({gameid:ObjectId(singleGame.game)}, async (err, response) => {

          if(err != null) {
            logger.error()
          } else {
          
          if(response != null) {
            if(response.totalUser == 0) {
              await getBoatUsersForGame(env.Lucky_Card_GAME_ID,1);
             }
          }  
          }
        });
      } */

        broadCastName = 'lucky_card_time_counter.js';
        totalGameTime = env.LuckyCard_Total_Game_Time
      } else if(singleGame.game == env.CARDSFIFTYTWO_GAME_ID) {
        broadCastName = 'cardsfiftytwo_time_counter.js';
        totalGameTime = env.CARDSFIFTYTWO_Total_Game_Time
      } else if(singleGame.game == env.TRIPLE_CHANCE_GAME_ID) {
        broadCastName = 'triplechance_time_counter.js';
        totalGameTime = env.TRIPLE_CHANCE_Total_Game_Time
      } else if(singleGame.game == env.SPIN_TO_WIN_GAME_ID) {
        broadCastName = 'spintowin_time_counter.js';
        totalGameTime = env.SPIN_TO_WIN_Total_Game_Time
       }

      
      if( broadCastName != '' ) {
        endTime = singleGame.end;
        await gameTimeCounterBroadCast(broadCastName,endTime,totalGameTime,singleGame.id )
      }
    }
  });

  const oneSecondJob1 = schedule.scheduleJob('*/1 * * * * *', async () => {

try {
    let settings = await settingsData();
    
    saveBettingAmount(settings['DRAGON_VS_TIGER_ID']);
  
    let obj = new NumberBettingHistory();
  
    if (dragonvsTiger == 1) {
      dragonvsTiger = 0;
      await obj.drawNumber(settings, 'dragonvstiger', async (response) => {
        dragonvsTiger = 1;

        if (response.status == 1) {
          
          if( response.number ) {
            
            let cardTypeFirst = Math.floor(Math.random() * (3 - 0 + 1) + 0);
            let cardTypeSecond = Math.floor(Math.random() * (3 - 0 + 1) + 0);
  2
            let firstNumber = Math.floor(Math.random() * (12 - 0 + 1) + 0);
            
            let cardsResponse = [];
  
            
            // card logic
            if( response.number == 1 || response.number == 3) {
  
              let secondNumber = Math.floor(Math.random() * (12 - 0 + 1) + 0);
  
              while(firstNumber == secondNumber) {
                secondNumber = Math.floor(Math.random() * (12 - 0 + 1) + 0);
              }
  
              // cardsResponse = [
              //   cardType[cardTypeFirst] + '-' + firstNumber,
              //   cardType[cardTypeSecond] + '-' + secondNumber
              // ];
  
              cardsResponse = [
                (cardTypeFirst*13) + firstNumber,
                (cardTypeSecond*13) + secondNumber
              ];
  
              if(response.number == 1) {
              
              if(firstNumber < secondNumber) {
                  cardsResponse = [
                    (cardTypeSecond*13) + secondNumber,
                    (cardTypeFirst*13) +  firstNumber
                  ];
                } 
              } else if (response.number == 3) {
                if(firstNumber > secondNumber) {
                  cardsResponse = [
                    (cardTypeSecond*13) + secondNumber,
                    (cardTypeFirst*13) +  firstNumber
                  ];
                }
              } 
            } else if( response.number == 2 ) {
              cardsResponse = [
                (cardTypeFirst*13) + firstNumber,
                (cardTypeSecond*13) + firstNumber
              ];
            }
  
            let gameHisUpdate = await GameHistory.updateOne({
              _id: response.gamehistoryid
            }, {
              cards: cardsResponse,
            });
            
            response.cards = cardsResponse; 
          }
          socketObject.emit('dragonvstigerwinnumberbroadcast', JSON.stringify(response));
        }
      });
    }

} catch(err) {
console.log(err);
}
  });

  const teenPattiJob = schedule.scheduleJob('*/1 * * * * *', async () => {

    try  {

      if(teenPattiStart){
        
        teenPattiStart = 0;

      let dateTime = new Date();
  
  // Current Rooms
  // {playtime: { $gte : dateTime.toISOString()}}
  // Todo: Filter the Room with time
		let currentRunningRoom = await Room.find({}).populate('bootid');

    
    if(currentRunningRoom.length) {
      for (const singleRoom in currentRunningRoom) {
             
			  if('bootid' in currentRunningRoom[singleRoom]) {

          // && currentRunningRoom[singleRoom].boatTime >= dateTime.toISOString()
          if( currentRunningRoom[singleRoom].requiredBoat ) {
            currentRunningRoom[singleRoom].requiredBoat = false;
            
            // Addd boats into room
            await teenPattiActiveBoats(currentRunningRoom[singleRoom],socketObject);
            //requiredBoat : 1,
            //boatTime : currentTime

          }

          if(	currentRunningRoom[singleRoom].play == 0 
              && currentRunningRoom[singleRoom].users.length > 1 
              && currentRunningRoom[singleRoom].playtime 
              && currentRunningRoom[singleRoom].playtime >= dateTime.toISOString()) {

            currentRunningRoom[singleRoom].playtime = '.js';
            currentRunningRoom[singleRoom].resetGameTime = '.js';
            
          //if(	currentRunningRoom[singleRoom].play == 0 && currentRunningRoom[singleRoom].playtime >= dateTime.toISOString() ) {
					currentRunningRoom[singleRoom].play = 1;
          //let room = await Room.findById(singleRoom).populate('bootid');
          let playingData = await PlayingData.find({roomid: currentRunningRoom[singleRoom].id, watching:false, packed: false, waiting:false}).populate(['roomid','userid']);
          
          //room.potValue = ;
          currentRunningRoom[singleRoom].potValue = (playingData.length * parseFloat(currentRunningRoom[singleRoom].bootid.bootValue));
          //currentRunningRoom[singleRoom].turn = 1;
          currentRunningRoom[singleRoom].shuffle = 1;
          //await currentRunningRoom[singleRoom].save();  

          socketObject.in(currentRunningRoom[singleRoom].id).emit("teenpatti_gamestarttimer", JSON.stringify({ timer: "Game start in 3 seconds." }));
          
          let singlePlayerswithSeat = {};

          let gameStartTimerAr = [];
          
          
          for (const singlePlayer of playingData) {
            
            if(!singlePlayer.watching) {
              await teenPattiWalletAndBetting(singlePlayer,parseFloat(currentRunningRoom[singleRoom].bootValue),socketObject);
              singlePlayerswithSeat[singlePlayer.seat] = singlePlayer.sumChaalValue
              await singlePlayer.save();
            }
            
            gameStartTimerAr.push({
              seat : singlePlayer.seat,
              username: singlePlayer.userid.username,
              playStatus: singlePlayer.watching ? (singlePlayer.waiting ? 'Watching' : 'Packed') : 'Play',
              cardStatus : singlePlayer.cardseen ? 'Seen' : 'Blind',
              photo: singlePlayer.userid.image,
              watching:  singlePlayer.watching
            });
          }

          socketObject.in(currentRunningRoom[singleRoom].id).emit("teenpatti_player_status", JSON.stringify(gameStartTimerAr));

          let allPlayigSeats = Object.keys(singlePlayerswithSeat);
          let dealerIndex = -1;

          if(currentRunningRoom[singleRoom].lastWinner && singlePlayerswithSeat[currentRunningRoom[singleRoom].lastWinner] != undefined) {
            dealerIndex = allPlayigSeats.indexOf(currentRunningRoom[singleRoom].lastWinner);
          }

          if(dealerIndex == -1) {
            dealerIndex = Math.floor(Math.random() * allPlayigSeats.length);
          }

          let dealer = allPlayigSeats[dealerIndex];

          currentRunningRoom[singleRoom].lastWinner = dealer;

          let turnIndex = dealerIndex + 1;
          
          if ( turnIndex ==  allPlayigSeats.length  ) {
          turnIndex = 0;
        }

        let curTime = new Date();
        
        curTime.setSeconds(curTime.getSeconds() + 5 + delayForCardPass);
        
        // bettingTime
         //  delayForCardPass
         currentRunningRoom[singleRoom].turnTimerEnd = curTime.toISOString();
         currentRunningRoom[singleRoom].currentTurn = allPlayigSeats[turnIndex];

         await currentRunningRoom[singleRoom].save();
          
         await PlayingData.updateOne({roomid:currentRunningRoom[singleRoom].id, seat: currentRunningRoom[singleRoom].currentTurn},{$set : {playCounter : Math.floor(Math.random() * (8 - 2 + 1) + 2)}});

          socketObject.in(currentRunningRoom[singleRoom].id).emit("teenpatti_startcardpass",JSON.stringify({
            seats : currentRunningRoom[singleRoom].seatings,
            nextTurn:currentRunningRoom[singleRoom].currentTurn,
            dealer: dealer,
            chaalValue : singlePlayerswithSeat,
            potValue :  currentRunningRoom[singleRoom].potValue 
          }));
        } else if(currentRunningRoom[singleRoom].play == 1 && currentRunningRoom[singleRoom].users.length > 1 && currentRunningRoom[singleRoom].turnTimerEnd){
          
          let playDataWithUser = await PlayingData.findOne({roomid:currentRunningRoom[singleRoom].id, seat: currentRunningRoom[singleRoom].currentTurn}).populate(['roomid','userid']);

          let curTime = new Date();
          let turnTime = new Date(currentRunningRoom[singleRoom].turnTimerEnd);

           let diff = Math.floor((turnTime.getTime() - curTime.getTime()) / 1000 );

           

           if(playDataWithUser ) {
            if(diff > 10) {
              // temp uncomment due stuck game after 10 seconds
              // nextturnfucCall
              //await startTimerOnNextTurn(currentRunningRoom[singleRoom],socketObject);
              teenPattiStart = 1;
              return;
            }

            let playingData = await PlayingData.find({roomid: currentRunningRoom[singleRoom].id, watching:false, packed: false, waiting:false}).populate('roomid');
            
            if( ('roomid' in playDataWithUser) ) {
            if( !playDataWithUser.roomid.stopTimer ) {

            if ( diff > 0 ) {

              if( playDataWithUser.userid.boat && playDataWithUser.playCounter >=  diff  ) {
                  // Take action for do activity
                 await performActivity(playDataWithUser, socketObject);

                // if(rspPerformAt == 'disconnect') {
                //   logger.error('disconnect case occor');
                //   await startTimerOnNextTurn(currentRunningRoom[singleRoom],socketObject);
                //   teenPattiStart = 1;
                // return ;
                // }
              }
              
              // currentRunningRoom[singleRoom].bootValue
              // bootValue = playDataWithUser.bootValue
              // playDataWithUser.userid.coins

              // Tmp comment
              if(playDataWithUser.roundCount == 2) {

                let players = await PlayingData.find({roomid:playDataWithUser.roomid, cardseen: false},{socketid : 1, cardseen : 1});	
		
                for (let singlePlayer of players) {
                 
                  // Card Seen
                  await cardSeen({id: singlePlayer.socketid }, socketObject , (response) => {
                   
                  });
              }  
            } 

            playDataWithUser.chaalValue = parseFloat(playDataWithUser.chaalValue);
                // Todo:
                socketObject.in(currentRunningRoom[singleRoom].id).emit("teenpatti_playertimer",JSON.stringify({
                  seats : currentRunningRoom[singleRoom].currentTurn,
                  counter:diff,
                  chaalValue : currentRunningRoom[singleRoom].chaalLimit < playDataWithUser.chaalValue ? currentRunningRoom[singleRoom].chaalLimit : playDataWithUser.chaalValue ,
                  risingValue: currentRunningRoom[singleRoom].chaalLimit < ( playDataWithUser.chaalValue * 2 ) ? currentRunningRoom[singleRoom].chaalLimit : ( playDataWithUser.chaalValue * 2 ),
                  lowbalance :  playDataWithUser.chaalValue > playDataWithUser.userid.coins ? 1 : 0,
                  roundCount : playDataWithUser.roundCount,
                  show:  playingData.length > 2 ? 0 : 1  
                }));
            } else {
              // Temp remove condtion
              // else if(diff >= 0 )
              socketObject.in(currentRunningRoom[singleRoom].id).emit("teenpatti_playertimer",JSON.stringify({
                seats : currentRunningRoom[singleRoom].currentTurn,
                counter:diff,
                chaalValue : currentRunningRoom[singleRoom].chaalLimit < playDataWithUser.chaalValue ? currentRunningRoom[singleRoom].chaalLimit : playDataWithUser.chaalValue ,
                risingValue: currentRunningRoom[singleRoom].chaalLimit < ( playDataWithUser.chaalValue * 2 ) ? currentRunningRoom[singleRoom].chaalLimit : ( playDataWithUser.chaalValue * 2 ),
                lowbalance :  playDataWithUser.chaalValue > playDataWithUser.userid.coins ? 1 : 0,
                roundCount : playDataWithUser.roundCount,
                show:  playingData.length > 2 ? 0 : 1  
              }));
              
              // Todo:
              if(playDataWithUser) {
                if('sideshowAskedBy' in playDataWithUser) {
                  if(playDataWithUser.sideshowAskedBy) {
                    socketObject.in(currentRunningRoom[singleRoom].id).emit('teenpatti_sideshowpacked',JSON.stringify({status:1,packed:true}));
                  }
                }
              }
                socketObject.in(currentRunningRoom[singleRoom].id).emit("teenpatti_playertimerEnd",JSON.stringify({
                  seats : currentRunningRoom[singleRoom].currentTurn,
                  counter:diff,
                }));
  
                // Todo pack
                await playerPacked(playDataWithUser, socketObject);
                
                 
             }
             
            }
          }
           } else {
             
            await startTimerOnNextTurn(currentRunningRoom[singleRoom],socketObject);
            
           }
        }
			}
		}
    }
    teenPattiStart = 1;    
  }
    } catch(err) {
      logger.error(err.message, {metadata: err});
    }
    
	
  });

}

const resetGameProccess = schedule.scheduleJob('*/1 * * * * *', async () => {
  
  try {
    let currentRunningRoom = await Room.find({}).populate('bootid');

  let dateTime = new Date();
  
  if(currentRunningRoom.length) {
    for (const singleRoom in currentRunningRoom) {
      if('bootid' in currentRunningRoom[singleRoom]) {
        if(	currentRunningRoom[singleRoom].play == 1
          && currentRunningRoom[singleRoom].resetGameTime 
          && currentRunningRoom[singleRoom].resetGameTime <= dateTime.toISOString()) {
            await resetRoomGame(currentRunningRoom[singleRoom], socketObject);
          }
      }}}  
  } catch (err) {
    logger.error(err.message, {metadata: err});
  }
  
});




// Roulte 91, 106
let gameTimeCounterBroadCast = async(broadCastName, endTime, totalTimeSeconds, gameHistoryId) => {

  let counter = 0;

  let currentDateTime = new Date(); // current date
  let betAllowTime = new Date(endTime); // mm/dd/yyyy format
  let timeDiff = betAllowTime.getTime() - currentDateTime.getTime(); // in miliseconds
  let timeDiffInSecond = Math.ceil(timeDiff / 1000); // in second
 let settings = await settingsData();

  if( broadCastName == 'dragon_vs_tiger_time_counter' ) {
    timeDiffInSecond = Math.round(timeDiff / 1000);
  }

      if (timeDiffInSecond < (parseInt(totalTimeSeconds) + 1 ) && timeDiffInSecond > 0) {
        counter = timeDiffInSecond;
      }
  if( broadCastName == 'dragon_vs_tiger_time_counter' && counter > 9 && counter < 19 ) {
        let enableBoat = parseInt(settings['dragon_vs_tiger_game_boat']);

        if(enableBoat == 1) {
            
            let boatBets = await autoBettingsByBoat(env.DRAGON_VS_TIGER_ID);
            if(boatBets != 1) {
                socketObject.emit('dragonvstigerboatbets', JSON.stringify(boatBets));
            }
      }
      
      }

      if( broadCastName == 'lucky_card_time_counter' && counter > 26 && counter < 104 ) {
        let enableBoat = parseInt(settings['lucky_card_game_boat']);
        
        if(enableBoat == 1) {
          let boatBets = await autoBettingsByBoat(env.Lucky_Card_GAME_ID);
          if(boatBets != 1) {
               
               socketObject.emit('luckycardboatbets', JSON.stringify(boatBets));
           }
        }  
      }

      socketObject.emit(broadCastName, JSON.stringify({
         'game': gameHistoryId,
         'counter' : counter
       }));

};


async function saveBettingAmount(gameid) {


  try {
  let gameHistory = await bettingAlowedGame(gameid);

  let newBetsNumberAr = {}; 
  if (gameHistory.length) {
    let bettings = await Betting.find({
      game_history: ObjectId(gameHistory[0].id),
      status: 'completed',
    }).populate('betting_type').exec();

    let totalGameAmount = 0;
    let numberBetAmount = {};
    /* let currentUsers = {}; */

    if (bettings.length) {
      for (let bet of bettings) {
        let tmpSaveBetsAmount = bet.amount / bet.betting_type.count;

        /*if(( bet.user.id in currentUsers ) == false) {
          currentUsers[bet.user.id] = {} ;
          currentUsers[bet.user.id]['name'] = bet.user.name;
          //currentUsers[bet.user.id]['image'] = bet.user.image;
          currentUsers[bet.user.id]['coins'] = bet.user.coins;
          
        } */

        for (let number of bet.numbers) {

          if (numberBetAmount[number] == undefined) {
            numberBetAmount[number] = {};
            newBetsNumberAr[number] = 0;
            numberBetAmount[number]['betamount'] = 0;
            numberBetAmount[number]['ifwindamount'] = 0;
          }
          newBetsNumberAr[number] += tmpSaveBetsAmount;
          if(bet.byBoat != true) {
            numberBetAmount[number]['betamount'] += tmpSaveBetsAmount;
            numberBetAmount[number]['ifwindamount'] += bet.winning;
          }
          
        }

        //byBoat
        if(bet.byBoat != true) {
          totalGameAmount += bet.amount;
        }
      }
      
      // tmp comment not required now
      // if( gameHistory[0].game == env.DRAGON_VS_TIGER_ID ) {
      //   socketObject.emit('dragonvstigercurrentgameusers', JSON.stringify(currentUsers));
      // }
    }

    let numberBetHistory = await NumberBettingHistory.find({
      game_history_id: gameHistory[0]._id,
    }).exec();
    for (let singleNub of numberBetHistory) {

      if (numberBetAmount[singleNub.number] == undefined) {
        singleNub.betamount = 0;
        singleNub.wincoins_if_draw_this_number = 0;

      } else {

        singleNub.betamount = numberBetAmount[singleNub.number]['betamount'];
        singleNub.wincoins_if_draw_this_number = numberBetAmount[singleNub.number]['ifwindamount'];

      }

      if( gameHistory[0].game == env.DRAGON_VS_TIGER_ID && singleNub.number == 2 ) {
        let halfBetAmount = 0;
        
        if(('1' in numberBetAmount)) {
          if(numberBetAmount['1']['betamount'] > 0) {
            halfBetAmount = halfBetAmount + (numberBetAmount['1']['betamount'] / 2);
          }
          
        }

        if(('3' in numberBetAmount)) {
          if(numberBetAmount['3']['betamount'] > 0) {
            halfBetAmount = halfBetAmount + ( numberBetAmount['3']['betamount'] / 2);
          }
        }

        singleNub.wincoins_if_draw_this_number = parseInt(singleNub.wincoins_if_draw_this_number) + parseInt(halfBetAmount);  
      }

      if (singleNub.betamount <= 0.01) {
        singleNub.betamount = 0;
        singleNub.wincoins_if_draw_this_number = 0;
      }
      await singleNub.save();
    }
    

    if( gameHistory[0].game == env.DRAGON_VS_TIGER_ID ) {
      socketObject.emit('dragonvstigerbetamount', JSON.stringify(newBetsNumberAr));
    } else if(gameHistory[0].game == env.Lucky_Card_GAME_ID) {
      socketObject.emit('luckycardbetamount', JSON.stringify(newBetsNumberAr));
    }
    
    if(gameHistory[0].total_betting !== totalGameAmount) {
      gameHistory[0].total_betting = totalGameAmount;
      await gameHistory[0].save();
    }
  }
} catch (err) {
  console.log(err);
  logger.error(err.message, {metadata: err});
  
}  
}


async function saveBettingAmountLowStorage(gameid) {

  let gameHistory = await bettingAlowedGame(gameid);

  if (gameHistory.length) {
    let bettings = await Betting.find({
      game_history: ObjectId(gameHistory[0].id),
      status: 'completed',
    }).populate('betting_type').exec();

    let totalGameAmount = 0;
    let numberBetAmount = {};

    if (bettings.length) {
      for (let bet of bettings) {
        let tmpSaveBetsAmount = bet.amount / bet.betting_type.count;
        for (let number of bet.numbers) {

          if (numberBetAmount[number] == undefined) {
            numberBetAmount[number] = {};
            numberBetAmount[number]['betamount'] = 0;
            numberBetAmount[number]['ifwindamount'] = 0;
          }

          numberBetAmount[number]['betamount'] += tmpSaveBetsAmount;
          numberBetAmount[number]['ifwindamount'] += bet.winning;
        }

        totalGameAmount += bet.amount;

      }
    }

    let insertDocs = [];

    for (let singleNumber in numberBetAmount) {
        insertDocs.push({
          number: singleNumber,
          game_history_id: ObjectId(gameHistory[0].id),
          betamount: numberBetAmount[singleNumber]['betamount'],
          wincoins_if_draw_this_number: numberBetAmount[singleNumber]['ifwindamount']
        });
      }

    // Deleted all previous bets  
    await NumberBettingHistory.deleteMany({game_history_id: ObjectId(gameHistory[0].id)});

    // Insert new bets
    if (insertDocs) {
      await NumberBettingHistory.insertMany(insertDocs);
    }
    
    if(gameHistory[0].total_betting !== totalGameAmount) {
      gameHistory[0].total_betting = totalGameAmount;
      await gameHistory[0].save();
    }
  }
}

async function createRandomBetsByBoats(gameObject,numbers) {
  
  // Todo: Temp Disable random bets

  if(0) {
      // Take random price for bets
  // Enter betting in Bets table
  // Trigger user id and betamount and bet number current after deduct such amount 
  // Get random user
  let boatUsers = await BoatUser.aggregate(
    [ 
      { $match : { game_history : ObjectId(gameObject.id)} },
      { $sample: { size: 10 } } 
    ]
 );

  let bettingType =  await BettingType.find({game:ObjectId(gameObject.game)}).exec();

  let tokens = [10,100,500,1000];
  let newBets = [];
  
  for (let singleUser of boatUsers) {
  let randomBetAmount = ( tokens[Math.floor(Math.random() * tokens.length)] * Math.floor(Math.random() * tokens.length) );
  let randomNumber = Math.floor(Math.random()*( ( Object.keys(numbers).length -1 ) - 0 + 1 ) + 0);
  let randomBettingType = Math.floor(Math.random()*( ( bettingType.length - 1 ) - 0 + 1 ) + 0);  

  // If coins is less than 1 lakh then add 500000 coins.
  if(singleUser.coins < 100000) {
    await BoatUser.updateOne({
      _id: singleUser.id
    }, {
      coins: (singleUser.coins + 500000),
    }
  );
}

    newBets.push({
      name:parseInt(randomNumber),
      amount:randomBetAmount,
      numbers: parseInt(randomNumber),
      winning: ( randomBetAmount * 10 ),
      win_status: false, 
      betting_type: bettingType[randomBettingType]._id,
      boat: ObjectId(singleUser.id),
      game_history: ObjectId(gameObject.id),
      status: 'completed'
    });
  }
  await BoatBetting.insertMany(newBets);

  // Trigger bets boat
  socketObject.emit('dragonvstigerboatbets', JSON.stringify(newBets));
  }
  
  let allBettings = await BoatBetting.find({game_history: ObjectId(gameObject.id)}).exec();

  if(allBettings.length) {
  
    let newBetsNumberAr = {};

    for (const singleNumber of Object.keys(numbers)) {
      newBetsNumberAr[numbers[singleNumber].number] = numbers[singleNumber].betamount;
    }

  for (const singleBetting of allBettings) {
    for (const singleNumber of singleBetting.numbers) {
      newBetsNumberAr[singleNumber] = newBetsNumberAr[(singleNumber - 1)] + ( singleBetting.amount / (singleBetting.numbers.length));
    }
  }

  
  return newBetsNumberAr;
} else {
  return 0; 
}
}
