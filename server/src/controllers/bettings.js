import {
    json,
    response,
    Router
  } from 'express';
  import requireJwtAuth from '../middleware/requireJwtAuth.js';
  import Betting from '../models/Betting.js';
  import BettingType from '../models/BettingType.js';
  import 'dotenv';
  
  import {
    settingsData,
    bettingAlowedGame,
    verifyToken,
    treeUnderUser,
    checkpermission,
    crGame
  } from '../helper/common.js';
  import User from '../models/User.js';
  import Game from '../models/Game.js';
  import Transaction from '../models/Transaction.js';
  import GameHistory from '../models/GameHistory.js';
  import GameCurrentUser from '../models/GameCurrentUser.js'
  import { Socket } from 'socket.io';
import array from 'joi/lib/types/array.js';
import { Logger } from 'winston';

Logger

import promise  from 'promise'
import mongoose from 'mongoose';
  
  const router = Router();
  
  const ObjectId = mongoose.Schema.Types.ObjectId;

  var socketConnection = {};

  export const updateSocket = (socket) => {
    socketConnection = socket;
  }
  
  /**
   * Create new betting.
   */
   export const createBet = async (requestedData = '',callback) => {
    
    // Default response
    let response = {
      status: 0,
      message: 'Issue in user inserting request',
    };

    if(!requestedData) {
        response.message = 'Please provide all information.'
        return callback(response);
    }
    
     
    try {
  
      let req = JSON.parse(requestedData);

      if(req.userid == undefined) {
        response.message = 'Please provide user id.';
        return callback(JSON.stringify(response));
      }
      
      if(req.betting_type == undefined) {
        response.message = 'Please provide betting type.';
        return callback(JSON.stringify(response));
      }

      if(req.amount == undefined) {
        response.message = 'Please provide amount.';
        return callback(JSON.stringify(response));
      }

      if(req.name == undefined) {
        response.message = 'Please provide name.';
        return callback(JSON.stringify(response));
      }

      if(req.numbers == undefined) {
        response.message = 'Please provide numbers.';
        return callback(JSON.stringify(response));
      }

      if(req.tokens == undefined) {
        response.message = 'Please provide tokens.';
        return callback(JSON.stringify(response));
      }




      // Check user current coins
      req.user = await User.findById(req.userid);

      if( !req.user ) {
        response.message = 'We dont have user with this id ' + req.userid;
        return callback(JSON.stringify(response));
      }

      let gameHistory = await bettingAlowedGame(req.user.current_game);
  
      // Check current game
      if (gameHistory.length) {
  
        // Check user coins for betting
        if (req.user.coins >= req.amount) {
          // Get betting type id
          let bettingType = await BettingType.findById(req.betting_type);
  
          // If wrong betting type sent
          if (!bettingType) {
            response.message = "We don't have " + req.betting_type + ' this betting type.';
            return callback(JSON.stringify(response));
          }
  
          if (bettingType.count != req.numbers.length) {
            response.message = "Wrong Number Supplied";
            return callback(JSON.stringify(response));
          }
          
          // Calculated winning amount
          let winning = bettingType.winning_x * parseInt(req.amount);
  
          req.user.coins = req.user.coins - parseInt(req.amount);
          req.user.betting_points = req.user.betting_points + parseInt(req.amount);
  
          let day = new Date();
  
          if (req.user.play_point_update == day.getDay()) {
            req.user.daily_play_points += parseInt(req.amount)
          } else {
            req.user.daily_play_points = parseInt(req.amount);
            req.user.play_point_update = day.getDay();
          }

          await req.user.save();
  
          // Create betting
          let betting = await Betting.create({
            name: req.name,
            amount: req.amount,
            numbers: req.numbers,
            winning: winning,
            win_status: false,
            user: req.user.id,
            betting_type: req.betting_type,
            game: req.user.current_game,
            tokens: req.tokens,
            game_history: gameHistory[0]._id,
            status: 'completed',
          });
  
          if (betting) {
            response.status = 1;
            response.message = '';
            response.betting = betting.toJSON();

            usercoins(req.userid, req.user.coins,gameHistory[0]._id);
  
          } else {
            response.message = 'Issue in bet create query';
          }
        } else {
          response.message = 'Insufficent balance for betting.';
        }
      } else {
        response.message = 'Betting has been closed for current game.';
      }
  
      return callback(JSON.stringify(response));;
    } catch (err) {
      logger.error(err.message, {metadata: err});
      response.message = err.message || err.toString();
      return callback(JSON.stringify(response));
    }
   }

   export const createBetWithUpdate = async (requestedData,socket, io ,callback) => {
    
    // Default response
    let response = {
      status: 0,
      message: 'Issue in inserting/updating bets.',
    };

    if(!requestedData) {
        response.message = 'Please provide all information.'
        return callback(response);
    }
    
     
    try {
  
      let req = JSON.parse(requestedData);

      if(typeof req.userid == undefined) {
        response.message = 'Please provide user id.';
        return callback(JSON.stringify(response));
      }

      if(typeof req.game_history == undefined) {
        response.message = 'Please provide game history.';
        return callback(JSON.stringify(response));
      }

      let t = new Date();

      t.setSeconds(t.getSeconds() + 1);
      // if(req.game_name == 'dragonvstiger') {
        
      // } else {
      //   t.setSeconds(t.getSeconds() + 2);
      // }
      
      let gameHistoryBetAllowCheck = await GameHistory.findOne({_id : ObjectId(req.game_history), betting_allow_time: {
        $gt: t.toISOString()
      }  });

      if(!gameHistoryBetAllowCheck) {
        response.message = 'Betting time has been closed.';
        return callback(JSON.stringify(response));
      }

      if(typeof req.bettings == undefined || !Array.isArray(req.bettings)) {
        response.message = 'Please provide create/update bettings listing.';
        return callback(JSON.stringify(response));
      }

      // Get user by id
      req.user = await User.findById(req.userid);

      if(!req.user) {
        response.message = 'We dont find user in our records.';
        return callback(JSON.stringify(response));
      }



      let totalRequestedAmount = 0, newBetsAr = {}, allBetTypes = [];
      let counter = 0;
      for (const singleBets of req.bettings) {
        newBetsAr[counter] = singleBets;
        counter++;
        if(singleBets.amount < 1) {
          response.message = 'Bet amount can not be 0 or negative value.'
          return callback(JSON.stringify(response));
        }


        totalRequestedAmount +=  singleBets.amount;
	
 allBetTypes.push(ObjectId(singleBets.betting_type));
      }

      let bettingTypes = await BettingType.find({_id: {$in : allBetTypes}}).exec();

      let betTypes = {};
      for (const singleType of bettingTypes) {
        betTypes[singleType.id] = singleType; 
      }
      
      let currentBettings = await Betting.find({ user : ObjectId(req.userid), game_history : ObjectId(req.game_history), status: 'completed' }).exec();

      let previousAmount = 0;
      for (const clgame of currentBettings) {
          previousAmount += clgame.amount;
      }  

      // Check wallet amount
      let walletDeduct = totalRequestedAmount - previousAmount;

      if(req.user.coins < walletDeduct) {
          response.message = 'Insufficient balance to process bets'
          return callback(JSON.stringify(response));
      }

      req.user.coins -= walletDeduct;

      if(req.user.lockedmoney > 0) {
        req.user.lockedmoney = req.user.lockedmoney - walletDeduct;
      }

      if(req.user.lockedmoney < 0) {
        req.user.lockedmoney = 0; 
      }

      req.user.betting_points +=  walletDeduct;
              let day = new Date();
    
              if (req.user.play_point_update == day.getDay()) {
                req.user.daily_play_points += walletDeduct;
    
                if (req.user.daily_play_points < 0) {
                  req.user.daily_play_points = 0
                }
    
              } else {
                req.user.daily_play_points = walletDeduct;
                req.user.play_point_update = day.getDay();
              }
    
              let userSave = await req.user.save();
 
      
      let createUpdateAr = [];

        for (const singleBet of Object.keys(newBetsAr)) {
           let singleAr = newBetsAr[singleBet];

          if(betTypes[singleAr.betting_type].count != singleAr.numbers.length) {
            response.message = 'Numbers length does not match with our records.'
            return callback(JSON.stringify(response));
          }


          let winning = betTypes[singleAr.betting_type].winning_x * singleAr.amount;

          createUpdateAr.push({
            name: singleAr.name,
            amount: singleAr.amount,
            numbers: singleAr.numbers,
            winning: winning,
            win_status: false,
            user: req.user.id,
            betting_type: singleAr.betting_type,
            game: req.user.current_game,
            tokens: singleAr.tokens,
            game_history:req.game_history,
            status: 'completed',
            localid:singleAr.localid
          })
        }
      

      let deleteMany = await Betting.deleteMany({ user : ObjectId(req.userid), game_history : ObjectId(req.game_history), status: 'completed' });
      let createUpdate = await Betting.insertMany(createUpdateAr);

        response.status = 1;
        response.message = '';
        response.betting = createUpdateAr;
	      usercoins(req.userid,req.user.coins,req.game_history,socket,io)
           
      return callback(JSON.stringify(response));;
    } catch (err) {
      logger.error(err.message, {metadata: err});
      response.message = err.message || err.toString();
      return callback(JSON.stringify(response));
    }
   }

   export const updateCurrentUser = async(requestedData, callback) => {
    
  // Default response
  let response = {
    status: 0,
    message: 'Issue in user inserting request',
  };

  try {

let req = JSON.parse(requestedData);


if(!requestedData) {
    response.message = 'Please provide all information.'
    return callback(response);
}

    
    if(typeof req.userid == undefined) {
      response.message = 'Please provide user id.';
      return callback(JSON.stringify(response));
    }
    req.user = await User.findById(req.userid);

    

    if(!req.user) {
      response.message = 'We dont find user in our records.';
      return callback(JSON.stringify(response));
    }
    
    let gameCurrentUser = await GameCurrentUser.findOne({gameid:req.user.current_game }).exec();
    
    gameCurrentUser.users.push(req.user.id);
    await gameCurrentUser.save();
    response.status = 1;
    response.message = 'Your bet will be process.';
    return callback(JSON.stringify(response));

  } catch(err) {

    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    return callback(JSON.stringify(response));
  }

   }   
   /**
   * Update betting.
   */
    export const updateBet = async (requestedData = '',callback) => {
    
      // Default response
      let response = {
        status: 0,
        message: 'Issue in update user request',
      };
  
      if(!requestedData) {
          response.message = 'Please provide all information.'
          return callback(response);
      }
      
       
      try {
    
        let req = JSON.parse(requestedData);
  
        if(req.userid == undefined) {
          response.message = 'Please provide user id.';
          return callback(JSON.stringify(response));
        }
        
        if(req.betid == undefined) {
          response.message = 'Please provide betid.';
          return callback(JSON.stringify(response));
        }
  
        if(req.amount == undefined) {
          response.message = 'Please provide amount.';
          return callback(JSON.stringify(response));
        }
        
        if(req.tokens == undefined) {
          response.message = 'Please provide tokens.';
          return callback(JSON.stringify(response));
        }
  
  
  
  
        // Check user current coins
        req.user = await User.findById(req.userid);
  
        if( !req.user ) {
          response.message = 'We dont have user with this id ' + req.userid;
          return callback(JSON.stringify(response));
        }
  
        let gameHistory = await bettingAlowedGame(req.user.current_game);
    
        // Check current game
        if (gameHistory.length) {


          ////////////////////
          let gameHistoryId = gameHistory[0]._id;

          let betting = await Betting.findOne({
          _id: req.betid,
          game_history: ObjectId(gameHistoryId),
          user: ObjectId(req.user.id),
          status: 'completed',
          }).populate('betting_type').exec();

          if (betting) {

            let amount = req.amount + betting.amount;
    
            let givenamount = req.amount;
    
            if (req.user.coins >= req.amount || req.amount < 0) {
    
              if (amount <= 0) {
                givenamount = 0 - betting.amount;
                await betting.remove();
                response.message = 'Bet deleted';
    
              } else {
    
                betting.amount = amount;
                betting.winning = betting.betting_type.winning_x * amount;
                betting.token = req.tokens;
                await betting.save();
    
                response.message = 'Bet has been updated';
    
              }
    
                           response.status = 1;
              
              usercoins(req.userid, req.user.coins,gameHistoryId);
    
            } else {
              response.message = 'Insufficent balance for bettings.';
            }
    
          } else {

            response.message = "We don't have any betting with this id";
    
          }
        } else {
          response.message = 'No Game avalible for bettings';
        }
    
        return callback(JSON.stringify(response));;
      } catch (err) {
        logger.error(err.message, {metadata: err});
        response.message = err.message || err.toString();
        return callback(JSON.stringify(response));
      }
     }

     /**
   * Clear bettings.
   */
    export const clearBet = async (requestedData = '',callback) => {
    
      // Default response
      let response = {
        status: 0,
        message: 'Issue in clear bet request.',
      };
  
      if(!requestedData) {
          response.message = 'Please provide all information.'
          return callback(response);
      }
      
       
      try {
    
        let req = JSON.parse(requestedData);
  
        if(req.userid == undefined) {
          response.message = 'Please provide user id.';
          return callback(JSON.stringify(response));
        }
        
        req.user = await User.findById(req.userid);
  
        if( !req.user ) {
          response.message = 'We dont have user with this id ' + req.userid;
          return callback(JSON.stringify(response));
        }
  
        // Get current if game is allowed for bettings
    const gameHistory = await bettingAlowedGame(req.user.current_game)

    if (gameHistory.length) {

      //  Game History id
      let gameHistoryId = gameHistory[0]._id;
      let totalBettingAmount = 0;

      // Update all bettings
      let updateAllBettings = await Betting.find({
        user: ObjectId(req.user.id),
        game_history: ObjectId(gameHistoryId),
        status: 'completed',
      }).populate('betting_type').exec();

      if (updateAllBettings.length) {
        for (let element of updateAllBettings) {
          totalBettingAmount = totalBettingAmount + element.amount;
        }

        await Betting.deleteMany({
          user: ObjectId(req.user.id),
          game_history: ObjectId(gameHistoryId),
          status: 'completed',
        }).exec();

        let updatedUsr = req.user;
        updatedUsr.coins = updatedUsr.coins + totalBettingAmount;
        updatedUsr.betting_points = updatedUsr.betting_points - totalBettingAmount;

        let day = new Date();

        if (updatedUsr.play_point_update == day.getDay()) {
          updatedUsr.daily_play_points -= totalBettingAmount;
          if (updatedUsr.daily_play_points < 0) {
            updatedUsr.daily_play_points = 0
          }
        } else {
          updatedUsr.daily_play_points = totalBettingAmount;
          updatedUsr.play_point_update = day.getDay();
        }
        await updatedUsr.save();

        response.status = 1;
        response.message = 'All bet has been cleared';

        usercoins(req.userid, updatedUsr.coins,gameHistoryId);

      } else {

        response.message = 'No bet avalible for clear.';
      }
    } else {
      response.message = 'Betting has been closed.';
    }
    return callback(JSON.stringify(response));;
      } catch (err) {
        logger.error(err.message, {metadata: err});
        response.message = err.message || err.toString();
        return callback(JSON.stringify(response));
      }
     }

     /**
   * Double bettings.
   */
    export const doubleBet = async (requestedData = '',callback) => {
    
      // Default response
      let response = {
        status: 0,
        message: 'Issue in double bet request.',
      };
  
      if(!requestedData) {
          response.message = 'Please provide all information.'
          return callback(response);
      }
      
       
      try {
    
        let req = JSON.parse(requestedData);
  
        if(req.userid == undefined) {
          response.message = 'Please provide user id.';
          return callback(JSON.stringify(response));
        }
        
        req.user = await User.findById(req.userid);
  
        if( !req.user ) {
          response.message = 'We dont have user with this id ' + req.userid;
          return callback(JSON.stringify(response));
        }
    // Check game allow for bettings
        const gameHistory = await bettingAlowedGame(req.user.current_game);

      if (gameHistory.length) {
      // Set current game id
      let gameHistoryId = gameHistory[0]._id;

      // Update all bettings
  let updateAllBettings = await Betting.find({
    user: req.user.id,
    game_history: gameHistoryId,
    status: 'completed',
  }).populate('betting_type').exec();

  // Check any betting exists
  if (updateAllBettings.length) {

    let bettingAmountTotal = 0;

    for (let sum of updateAllBettings) {
      bettingAmountTotal = bettingAmountTotal + sum.amount;
    }

    // Compare user coins for betting
    if (req.user.coins >= bettingAmountTotal) {

      req.user.coins = req.user.coins - bettingAmountTotal;
      req.user.betting_points = req.user.betting_points + bettingAmountTotal;

      let day = new Date();

      if (req.user.play_point_update == day.getDay()) {
        req.user.daily_play_points += bettingAmountTotal
      } else {
        req.user.daily_play_points = bettingAmountTotal;
        req.user.play_point_update = day.getDay();
      }
      await req.user.save();

      for (let element of updateAllBettings) {
        element.amount = element.amount * 2;
        element.winning = element.winning * 2;
        await element.save();
      }

      response.status = 1;
      response.message = 'Double request successfully processed';

      usercoins(req.userid, user.coins, gameHistoryId);

    } else {
      response.message = 'Insuficent balance to place the bet.';
    }
  } else {
    response.message = "You don't have any betting for double.";
  }
} else {
  response.message = 'Betting has been closed.';
}
    return callback(JSON.stringify(response));;
      } catch (err) {
        logger.error(err.message, {metadata: err});
        response.message = err.message || err.toString();
        return callback(JSON.stringify(response));
      }
     }

     /**
     * Repeat Bettings
      @param {} requestedData 
      @param {} callback 
     * @returns 
     */ 
      export const repeatBet = async (requestedData = '',socket,io,callback) => {
    
        // Default response
        let response = {
          status: 0,
          message: 'Issue in repeat bet request.',
        };
    
        if(!requestedData) {
            response.message = 'Please provide all information.'
            return callback(response);
        }
         
        try {
      
          let req = JSON.parse(requestedData);
    
          if(req.userid == undefined) {
            response.message = 'Please provide user id.';
            return callback(JSON.stringify(response));
          }
          
          req.user = await User.findById(req.userid);
    
          if( !req.user ) {
            response.message = 'We dont have user with this id ' + req.userid;
            return callback(JSON.stringify(response));
          }
  
        // For last bet of current user
        let lastBetOfUser = await Betting.findOne({
          user: ObjectId(req.user.id),
          game: ObjectId(req.user.current_game),
          status: 'completed'
        }, {
          _id: 0,
          game_history: 1
        })
          .sort({
            createdAt: 'desc'
          }).exec();
  
        if (lastBetOfUser) {
  
  
           // let allBets = [];
  
            let previousBettings = await Betting.find({
              user: req.user.id,
              game_history: lastBetOfUser.game_history,
              status: 'completed',
            }).exec();
  
            /*
            // Check any betting exists
            if (previousBettings.length) {
  
              //let bettingAmountTotal = 0;
  
              // Check user current coins
              let user = req.user;
  
              let allBettingsForInsert = [];
              for (let element of previousBettings) {
                bettingAmountTotal = bettingAmountTotal + element.amount;
  
                allBettingsForInsert.push({
                  name: element.name,
                  amount: element.amount,
                  numbers: element.numbers,
                  winning: element.amount * element.betting_type.winning_x,
                  win_status: false,
                  user: element.user,
                  betting_type: element.betting_type.id,
                  game: element.game,
                  tokens: element.tokens,
                  game_history: ObjectId(gameHistoryId),
                  status: 'completed',
      localid : element.localid
                });
  
              }
  
              // Compare user coins for betting
              if (user.coins >= bettingAmountTotal) {
  
                user.coins = user.coins - bettingAmountTotal;
                user.betting_points = user.betting_points + bettingAmountTotal;
                let day = new Date();
  
                if (user.play_point_update == day.getDay()) {
                  user.daily_play_points += bettingAmountTotal
                } else {
                  user.daily_play_points = bettingAmountTotal;
                  user.play_point_update = day.getDay();
                }
                await user.save();
  
                allBets = await Betting.insertMany(allBettingsForInsert);
  
                response.bettings = allBets; */
  
                if (previousBettings.length) {
                response.status = 1;
                response.bettings = previousBettings;
                response.message = 'Bettings given for bettings successfully';
                //usercoins(req.userid, user.coins, gameHistoryId,socket,io);
  
              } else {
                response.message = "You don't have any betting for Repeat.";
              }
        } else {
          response.message = "You don't find any betting with current user.";
        }
     
  
      return callback(JSON.stringify(response));;
        } catch (err) {
          logger.error(err.message, {metadata: err});
          response.message = err.message || err.toString();
          return callback(JSON.stringify(response));
        }
       }
       
     
     const usercoins = async (userId,coins,gameHistoryId,socket,io) => {
      
      let response = {};
      try {
        
        response.coins = coins;
        response.betting = 0;
    
          // Get the current betting sum
          const agg = await Betting.aggregate([
            {
              $match: {
                user: ObjectId(userId),
                game_history: ObjectId(gameHistoryId),
                status: 'completed',
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: '$amount',
                },
              },
            },
          ]).exec();
    
          if (agg.length > 0) {
            if (agg[0].total !== undefined) {
              response.betting = agg[0].total;
            }
          }
        io.to(socket.id).emit('usercoins',JSON.stringify(response));      
        
      } catch (err) {
        logger.error(err.message, {metadata: err});
      }
    }
    export const usercoinsonaction = async (requestedData, callback) => {
      
      let response = {};
      try {

        let req = JSON.parse(requestedData);

      if(req.userid == undefined) {
        response.message = 'Please provide user id.';
        return callback(JSON.stringify(response));
      }
      
      
        req.user = await User.findById(req.userid);
      
        
      if( !req.user ) {
        response.message = `We dont find the user with this user id - ${req.userid} `;
        return callback(JSON.stringify(response));
      }
        response.coins = req.user.coins;
        response.betting = 0;
    
        let gameHistory = await crGame(req.user.current_game);

        if (gameHistory) {

          // Get the current betting sum
          const agg = await Betting.aggregate([
            {
              $match: {
                user: ObjectId(req.userid),
                game_history: ObjectId(gameHistory._id),
                status: 'completed',
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: '$amount',
                },
              },
            },
          ]).exec();
    
          if (agg.length > 0) {
            if (agg[0].total !== undefined) {
              response.betting = agg[0].total;
            }
          }
        }  
          return callback(JSON.stringify(response));
      } catch (err) {
        logger.error(err.message, {metadata: err});
        response.message = err.message || err.toString();
        return callback(JSON.stringify(response));
      }
    }

    export const ticketGameBuy = async (requestedData,callback) => {


// Default response
let response = {
  status: 0,
  message: 'Issue in inserting/updating bets.',
};

if(!requestedData) {
    response.message = 'Please provide all information.'
    return callback(response);
}

 
try {

  let req = JSON.parse(requestedData);

  if(typeof req.userid == undefined) {
    response.message = 'Please provide user id.';
    return callback(JSON.stringify(response));
  }

  if(typeof req.game_history == undefined) {
    response.message = 'Please provide game history.';
    return callback(JSON.stringify(response));
  }

  // Get user by id
  req.user = await User.findById(req.userid);

  if(!req.user) {
    response.message = 'We dont find user in our records.';
    return callback(JSON.stringify(response));
  }

  let t = new Date();

     
  t.setSeconds(t.getSeconds() + 5);
  
  let gameHistoryBetAllowCheck = await GameHistory.findOne(
    {
      _id : ObjectId(req.game_history),
      game:req.user.current_game, 
      betting_allow_time: {
          $gt: t.toISOString()
      }
    });

  if(!gameHistoryBetAllowCheck) {
    response.message = 'Betting time has been closed.';
    return callback(JSON.stringify(response));
  }

  if(typeof req.bettings == undefined || !Array.isArray(req.bettings)) {
    response.message = 'Please provide create/update bettings listing.';
    return callback(JSON.stringify(response));
  }

  


    // Check current game
    if ( gameHistoryBetAllowCheck ) {

      let bettingTypes = await BettingType.find({'game': req.user.current_game});
      
      let betTypeCountWin = {};
      for (const bettingType of bettingTypes) {        
        betTypeCountWin[bettingType.id] = {};
        betTypeCountWin[bettingType.id]['count'] = bettingType.count;
        betTypeCountWin[bettingType.id]['winning_x'] = bettingType.winning_x; 
      }

      let newBets = [];
      let winning, sum = 0;

      let ticketId = await Betting.find({ ticket_id: { $ne: 0 }, ticket_id: {$exists: true} }).sort({ ticket_id: -1 }).limit(1).exec();

        let tmpTicketId = await settingsData('TICKET_ID');
        tmpTicketId = parseInt(tmpTicketId)

        if (ticketId.length) {
          tmpTicketId = ticketId[0].ticket_id + 1;
        }

      for (const singleBet of req.bettings) {

        if (betTypeCountWin[singleBet.betting_type]['count'] != singleBet.numbers.length) {
          response.message = 'Wrong Number Supplied';
          return callback(JSON.stringify(response));
        }

        sum += parseInt(singleBet.amount);
        
        winning = betTypeCountWin[singleBet.betting_type]['winning_x'] * singleBet.amount;
        
        newBets.push({
          name: singleBet.name,
          amount: singleBet.amount,
          numbers: singleBet.numbers,
          winning: winning,
          win_status: false,
          user: req.user.id,
          betting_type: singleBet.betting_type,
          game: req.user.current_game,
          tokens: singleBet.tokens,
          game_history: gameHistoryBetAllowCheck._id,
          status: 'completed',
          ticket_id : tmpTicketId,
          localid : singleBet.localid
        });
      }

    // Check wallet 
      if( req.user.coins >= sum && sum > 0){
        
        await Betting.insertMany(newBets);
        req.user.coins = req.user.coins - sum;
        req.user.betting_points = req.user.betting_points + sum;
       

        let day = new Date();

        if (req.user.play_point_update == day.getDay()) {
          req.user.daily_play_points += sum;
          if (req.user.daily_play_points < 0) {
            req.user.daily_play_points = 0
          }
        } else {
          req.user.daily_play_points = sum;
          req.user.play_point_update = day.getDay();
        }
        await req.user.save();

        response.message = 'Bets created'
        response.ticket_id = tmpTicketId;
        response.drawid = gameHistoryBetAllowCheck._id;
        response.bets = newBets;
        response.drawtime = gameHistoryBetAllowCheck.betting_allow_time;
        response.tickettime = new Date().toISOString();
        response.totalamount = sum;
        response.status = 1;

      } else {
        
        response.message = 'Insufficent balance for bettings.';
      
      }
    } else {
      response.message = 'Betting has been closed for current game.';
    }

  } catch (err) {
    logger.error(err.message, {metadata: err});
    response.message = err.message || err.toString();
    
  }

  return callback(JSON.stringify(response));

 }
