import NumberBettingHistory from '../models/NumberBettingHistory.js';
import GameHistory from '../models/GameHistory.js';
import {
  settingsData,
  bettingAlowedGame
} from '../helper/common.js';

import Betting from '../models/Betting.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import 'dotenv';
import LockedDevices from '../models/LockedDevices.js';
const env = process.env;
const schedule = require('node-schedule');
const ObjectId = require('mongoose').Types.ObjectId;

let logger = require('./logger');

//logger.info('Testing created');
//logger.error('Error Testing created', {metadata: {abc:'testing'}});
let delayIn52cardsGame = 1;



// temp stop all game scheduler
if (env.STOP_SCHEDULE != 1 && 0) {
 
  const job = schedule.scheduleJob('*/3 * * * *', async () => {

    let settings = await settingsData();

    let roulte_game_time = settings['ROLLETE_GAME_TIME'];
    let gameGap = settings['GAME_GAP'];
    let bettingIntervalTime = settings['BETTING_INTERVAL_TIME'];

    let gameId = settings['ROLLETE_GAME_ID'];

    let t = new Date();

    t.setSeconds(t.getSeconds() + parseInt(gameGap));
    let start = t.toISOString();

    
    t.setSeconds(t.getSeconds() + parseInt(bettingIntervalTime));
    let betting_allow_time = t.toISOString();
    
    t.setSeconds(t.getSeconds() + parseInt(roulte_game_time) - parseInt(bettingIntervalTime));
    let end = t.toISOString();
    
    let start2 = end;
    
    t.setSeconds(t.getSeconds() + parseInt(bettingIntervalTime));
    let betting_allow_time2 = t.toISOString();
    

    t.setSeconds(t.getSeconds() + parseInt(roulte_game_time) - parseInt(bettingIntervalTime));
    let end2 = t.toISOString();
    
    try {


      let gameHistories = [{
        start: start,
        end: end,
        total_betting: 0,
        total_winning: 0,
        betting_allow_time: betting_allow_time,
        game: gameId,
        jackpot: 0
      },
      {
        start: start2,
        end: end2,
        total_betting: 0,
        total_winning: 0,
        betting_allow_time: betting_allow_time2,
        game: gameId,
        jackpot: 0
      }
      ];

      let gameHistory = GameHistory.insertMany(gameHistories, function (err, result) {

        let insertDocs = [];
        let allNumber = [
          '00', 0,
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
          13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
          25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36
        ];

        for (let gameHisSingle of result) {
          for (let element of allNumber) {
            insertDocs.push({
              number: element,
              game_history_id: gameHisSingle._id,
              betamount: 0,
              wincoins_if_draw_this_number: 0
            });
          }
        }

        if (insertDocs) {
          NumberBettingHistory.insertMany(insertDocs);
        }
      });

    } catch (err) {
      logger.error(err.message, {metadata: err});
    }
  });

  const spinToWinGame = schedule.scheduleJob('*/1 * * * *', async () => {

    let settings = await settingsData();
  
    let luckycard_game_time = settings['SPIN_TO_WIN_Total_Game_Time'];
    let bettingIntervalTime = settings['SPIN_TO_WIN_Timer_Time'];
    let gameGap = 15;
  
    let t = new Date();
  
    t.setSeconds(t.getSeconds() + parseInt(gameGap));
    let start = t.toISOString();
  
    
    t.setSeconds(t.getSeconds() + parseInt(bettingIntervalTime));
    let betting_allow_time = t.toISOString();
    
    t.setSeconds(t.getSeconds() + parseInt(luckycard_game_time) - parseInt(bettingIntervalTime));
    let end = t.toISOString();
    
    let gameId = settings['SPIN_TO_WIN_GAME_ID'];
  
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
      let allNumber = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
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
  
    } catch (err) {
      logger.error(err.message, {metadata: err});
    }
  });
  
  const oneMinJob52cards = schedule.scheduleJob('*/1 * * * *', async () => {

    if( delayIn52cardsGame ) {
      delayIn52cardsGame = 0;
      return 1;
    }

    let settings = await settingsData();
  
    let card52_game_time = settings['CARDSFIFTYTWO_Total_Game_Time'];
    let bettingIntervalTime = settings['CARDSFIFTYTWO_Timer_Time'];
    let gameGap = 15;
  
    
    let t = new Date();
  
    t.setSeconds(t.getSeconds() + parseInt(gameGap));
    let start = t.toISOString();
  
    t.setSeconds(t.getSeconds() + parseInt(bettingIntervalTime));
    let betting_allow_time = t.toISOString();
    
    t.setSeconds(t.getSeconds() + parseInt(card52_game_time) - parseInt(bettingIntervalTime));
    let end = t.toISOString();
    
    let gameId = settings['CARDSFIFTYTWO_GAME_ID'];
  
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
      lastGameEndTime.setSeconds(lastGameEndTime.getSeconds() + parseInt(card52_game_time) - parseInt(bettingIntervalTime));
      end = lastGameEndTime.toISOString();
  
      if (diffInSeconds < 0) {
        start = currentTime.toISOString();
  
        currentTime.setSeconds(currentTime.getSeconds() + parseInt(bettingIntervalTime));
        betting_allow_time = currentTime.toISOString();
        currentTime.setSeconds(currentTime.getSeconds() + parseInt(card52_game_time) - parseInt(bettingIntervalTime));
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
      let allNumber = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,13,
                       14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,25,26,
                       27, 28, 29, 30, 31, 32, 33, 34, 35, 36,37,38,39,
                      40, 41, 42, 43, 44, 45, 46, 47, 48,49,50,51,52];
  
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
  
    } catch (err) {
      logger.error(err.message, {metadata: err});
    }
  });

  const oneMinJob333chanceCards = schedule.scheduleJob('*/1 * * * *', async () => {

    let settings = await settingsData();
    
    let tripleChance_Game_time = settings['TRIPLE_CHANCE_Total_Game_Time'];
    let bettingIntervalTime = settings['TRIPLE_CHANCE_Timer_Time'];
    let gameGap = 15;
  
    
    let t = new Date();
  
    t.setSeconds(t.getSeconds() + parseInt(gameGap));
    let start = t.toISOString();
  
    t.setSeconds(t.getSeconds() + parseInt(bettingIntervalTime));
    let betting_allow_time = t.toISOString();
    
  
    t.setSeconds(t.getSeconds() + parseInt(tripleChance_Game_time) - parseInt(bettingIntervalTime));
    let end = t.toISOString();
    
    let gameId = settings['TRIPLE_CHANCE_GAME_ID'];
  
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
      lastGameEndTime.setSeconds(lastGameEndTime.getSeconds() + parseInt(tripleChance_Game_time) - parseInt(bettingIntervalTime));
      end = lastGameEndTime.toISOString();
  
      if (diffInSeconds < 0) {
        start = currentTime.toISOString();
  
        currentTime.setSeconds(currentTime.getSeconds() + parseInt(bettingIntervalTime));
        betting_allow_time = currentTime.toISOString();
        currentTime.setSeconds(currentTime.getSeconds() + parseInt(tripleChance_Game_time) - parseInt(bettingIntervalTime));
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
  
    } catch (err) {
      logger.error(err.message, {metadata: err});
    }
  });
 
  
// Jhanda munda comment
  // const thirtySecondJob = schedule.scheduleJob('*/30 * * * * *', async () => {

  //   let settings = await settingsData();

  //   let luckycard_game_time = settings['JH_TOTAL_GAME_TIME'];
  //   let bettingIntervalTime = settings['JH_TIMER_TIME'];
  //   let gameGap = settings['JH_WAIT_TIME'];

  //   let gameId = settings['JH_GAME_ID'];

  //   let d = new Date();

  //   d.setSeconds(d.getSeconds() + parseInt(gameGap));
  //   let start = d.toISOString();
    

  //   d.setSeconds(d.getSeconds() + parseInt(bettingIntervalTime));
  //   let betting_allow_time = d.toISOString();
    
  //   d.setSeconds(d.getSeconds() + parseInt(luckycard_game_time) - parseInt(bettingIntervalTime));
  //   let end = d.toISOString();
    
  //   try {

  //     let gameHistory = await GameHistory.create({
  //       start: start,
  //       end: end,
  //       total_betting: 0,
  //       total_winning: 0,
  //       betting_allow_time: betting_allow_time,
  //       game: gameId,
  //       jackpot: 0,
  //     });

  //     let insertDocs = [];
  //     let allNumber = [1, 2, 3, 4, 5, 6];


  //     for (let element of allNumber) {
  //       insertDocs.push({
  //         number: element,
  //         game_history_id: gameHistory._id,
  //         betamount: 0,
  //         wincoins_if_draw_this_number: 0
  //       });
  //     }

  //     if (insertDocs) {
  //       await NumberBettingHistory.insertMany(insertDocs);
  //     }

  //   } catch (err) {
  //     logger.error(err.message, {metadata: err});
  //   }
  // });

  const oneHourJob = schedule.scheduleJob('0 */1 * * *', async () => {

    let d = new Date();
    d.setHours(d.getHours() - 1);

    let t = new Date();
    t.setHours(t.getHours() - 2);


    try {

      await NumberBettingHistory.deleteMany({
        betamount: 0,
        updatedAt: {
          $lt: d.toISOString()
        }
      }).exec();

      await Transaction.deleteMany({
        type: "REVERSE"
      }).exec();

      let bettings = await Betting.find({
        updatedAt: {
          $gt: d.toISOString(),
          $lt: t.toISOString()
        }
      }, 'game_history').exec();


      await GameHistory.deleteMany({
        total_betting: 0,
        _id: { $nin: ObjectId(bettings.game_history) },
        end: {
          $gt: d.toISOString(),
          $lt: t.toISOString()
        }
      }).exec();


    } catch (err) {
      logger.error(err.message, {metadata: err});
    }

  });

  let everyDayJob = schedule.scheduleJob('0 0 * * *', async() => {

    User.updateMany({ daily_play_points: { $ne: 0 } }, { "$set": { "daily_play_points": 0, "profit_loss": 0 } }).exec();

    // Removed older then 15 to 17 days
    let d = new Date();
    d.setDate(d.getDate() - 17);

    try {

      /*
      let filter = {};

      filter.updatedAt = {
        $lt: d.toISOString()
      };

      // Delete all bettings
      await Betting.deleteMany(filter);

      // Delete number bettings History 
      await NumberBettingHistory.deleteMany(filter).exec();
      
      // Delete all transaction
      await Transaction.deleteMany(filter);

      // Delete all transaction
      await GameHistory.deleteMany(filter); */

      let newDate = new Date();
      newDate.setDate(newDate.getDate() - 7);

      LockedDevices.deleteMany({createdAt : {
        $lt: newDate.toISOString()
      }});
    
    } catch (err) {
      
      logger.error((err.message || err.toString()), {metadata: err});
      
    }
  });
}