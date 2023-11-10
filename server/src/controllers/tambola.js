import { json, response, Router } from 'express';
import requireJwtAuth from '../middleware/requireJwtAuth.js';
import Betting from '../models/Betting.js';
import BettingType from '../models/BettingType.js';
import 'dotenv';

import { settingsData, bettingAlowedGame, verifyToken, treeUnderUser, checkpermission, crGame } from '../helper/common.js';
import User from '../models/User.js';
import Game from '../models/Game.js';
import Transaction from '../models/Transaction.js';
import GameHistory from '../models/GameHistory.js';
import GameCurrentUser from '../models/GameCurrentUser.js';
import { Socket } from 'socket.io.js';
import array from 'joi/lib/types/array.js';
import TambolaGameHistory from '../models/TambolaGameHistory.js';
import TambolaReward from '../models/TambolaReward.js';
import TambolaGameTicket from '../models/TambolaGameTicket.js';

let logger = require('../services/logger');

var promise = require('promise');

const router = Router();

const ObjectId = require('mongoose').Types.ObjectId;

var socketConnection = {};

export const updateSocket = (socket) => {
  socketConnection = socket;
};

export const getLiveFutureGame = async (reqtData = '') => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue to get live and future games',
  };

  try {
    let cuDate = new Date();

    cuDate.setHours(0,0,0,0);
    
    let filters = {};

    if ( Object.keys(reqtData).length ) {
      // Filters
      if (reqtData.start) {
        let startDate = new Date(reqtData.start);
        filters.start = { $gte: startDate.toISOString() };

        if (reqtData.end) {
          let endDate = new Date(reqtData.end);
          filters.start = { $gte: startDate.toISOString(), $lt: endDate.toISOString() };
        }
      }

      if (reqtData.gameid) {
        filters = {
          gameHistory: reqtData.gameid,
        };
      }
      console.log('if')
    } else {
      console.log('else');
      filters.start = { $gte: cuDate };
    }
    
    let gameList = await TambolaGameHistory.find(filters).populate('rewards._id', 'name').sort({start: 1});

    
    response.gameList = gameList;
    response.status = 1;
    response.message = '.js';

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};

export const getFutureGameDates = async (reqtData = '') => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in get dates.',
  };

  try {
    let cuDate = new Date();

    cuDate.setHours(0, 0, 0);

    let filters = {};
    filters.start = { $gte: cuDate.toISOString() };
    filters.status = { $ne: false };

    let gameList = await TambolaGameHistory.find(filters, 'start');

    let allDates = {};
    let year, month, date;
    gameList.map((value) => {
      let dt = new Date(value.start);

      year = dt.getFullYear();
      month = dt.getMonth() + 1;
      date = dt.getDate();

      if (!(year + '-' + month + '-' + date in allDates)) {
        allDates[year + '-' + month + '-' + date] = 0;
      }
      allDates[year + '-' + month + '-' + date] += 1;

      return 1;
    });

    response.list = Object.keys(allDates);
    response.status = 1;
    response.message = '.js';

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};

export const getDateWiseFutureGame = async (reqtData = '') => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in date wise games list',
  };

  try {
    if (!reqtData) {
      response.message = 'Please send required params..js';
      return response;
    }

    if (!reqtData.date) {
      response.message = 'Please send date to get game info..js';
      return response;
    }

    let filters = {};

    // Start date
    let start = new Date();

    if (reqtData.date) {
      start = new Date(reqtData.date);
    }
    start.setHours(0, 0, 0);

    // End date
    let end = new Date();

    if (reqtData.date) {
      end = new Date(reqtData.date);
    }
    end.setHours(23, 59, 59);

    filters.start = {
      $gte: start.toISOString(),
      $lte: end.toISOString(),
    };
    filters.status = { $ne: false };

    let gameList = await TambolaGameHistory.find(filters).populate('rewards._id', 'name');
    response.gameList = gameList;
    response.status = 1;
    response.message = '.js';

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};

export const getTambolaGamebyId = async (reqtData) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in game data',
  };

  try {
    let cuDate = new Date();

    cuDate.setHours(0, 0, 0);

    let singleTambolaGame = await TambolaGameHistory.findOne({ gameHistory: ObjectId(reqtData.gameid) })
      .populate('rewards._id')
      .populate({
        path: 'rewards.ticketids',
        populate: {
          path: 'userid',
        },
      });

    if (singleTambolaGame) {
      response.singleGame = singleTambolaGame;
      response.status = 1;
      response.message = '.js';
    }

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};

export const getTambolaAllTicketsByGamePerSet = async (reqtData) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in game data',
  };

  try {
    let cuDate = new Date();
    cuDate.setHours(0, 0, 0);

    let page = reqtData.page ? reqtData.page - 1 : 0;
    let noOfTicketsPerPage = 6;

    let setAsk = reqtData.askSet ? reqtData.askSet : 0;

    if (setAsk) {
      let ganeHis = await TambolaGameHistory.findOne({ gameHistory: ObjectId(reqtData.gameid) });
      page = parseInt((setAsk * ganeHis.ticketSet) / noOfTicketsPerPage) - 1;
    }

    let allTickets = await TambolaGameTicket.find({ gameHistory: ObjectId(reqtData.gameid) })
      .sort({ ticketid: 1 })
      .skip(page * noOfTicketsPerPage)
      .limit(noOfTicketsPerPage);

    response.allTickets = allTickets;
    response.currentPage = page;
    response.status = 1;
    response.message = '.js';

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};

export const getTambolaAllTicketsByGame = async (reqtData) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in game data',
  };

  try {
    let cuDate = new Date();
    cuDate.setHours(0, 0, 0);

    let page = reqtData.page ? reqtData.page - 1 : 0;
    let noOfTicketsPerPage = 300;

    let allTickets = await TambolaGameTicket.find({ gameHistory: ObjectId(reqtData.gameid) })
      .sort({ ticketid: 1 })
      .skip(page * noOfTicketsPerPage)
      .limit(noOfTicketsPerPage);

    response.allTickets = allTickets;
    response.status = 1;
    response.message = '.js';

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};

export const tambolaTicketBooking = async (reqtData) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in game data',
  };

  try {
    let cuDate = new Date();
    cuDate.setHours(0, 0, 0);

    let gameid = reqtData.gameid;
    let userid = reqtData.userid;
    let ticketIds = reqtData.boxes;

    // Tambola Game ID
    let tambolaGameId = ObjectId('64410e6ed3a7eca8ad628ff3');

    // Get user
    let user = await User.findById(userid);

    // Tambola Game History
    let gameHis = await TambolaGameHistory.findOne({ gameHistory: ObjectId(gameid) });

    if(user.coins < gameHis.ticketPrice ) {
      response.message = 'Insufficient balance.js';
      return response;
    }

    if (ticketIds.length != gameHis.ticketSet) {
      response.message = 'Ticket ids is not matched with set.js';
      return response;
    }

    let validationSequance = ticketIds.every(function (num, index) {
      if (index == ticketIds.length - 1) {
        return true;
      }
      return ticketIds[index + 1] - num == 1;
    });

    if (!validationSequance) {
      response.message = 'Send Ticket ids in sequance.js';
      return response;
    }

    if (!(ticketIds[0] % gameHis.ticketSet == 1 && ticketIds[ticketIds.length - 1] % gameHis.ticketSet == 0)) {
      response.message = 'First and last element is not in sets.js';
      return response;
    }

    let whichOneSetRequsted = parseInt(ticketIds[ticketIds.length - 1] / gameHis.ticketSet);

    let bettingData = {
      name: 'Tambola ticket buy',
      amount: gameHis.ticketPrice,
      numbers: ticketIds,
      winning: 0,
      win_status: false,
      user: ObjectId(userid),
      // need to enter betting_type
      game: tambolaGameId,
      game_history: gameHis.gameHistory,
      tokens: [],
      status: 'completed',
    };

    let betting = await Betting.create(bettingData);

    user.coins = user.coins - betting.amount;
    user.betting_points = user.betting_points - betting.amount;
    user.daily_play_points = user.daily_play_points - betting.amount;
    user.save();

    if (betting) {
      let transactionData = {
        type: 'SUBTRACT',
        betting_id: betting.id,
        game_history_id: gameHis.gameHistory,
        game_id: tambolaGameId,
        fromUser: user.id,
        trans_coins: betting.amount,
        comment: `Buy Ticket Set ${whichOneSetRequsted} [${ticketIds.toString()}]`,
        remaining_coins: user.coins,
      };

      Transaction.create(transactionData);
    }
    await TambolaGameTicket.updateMany(
      { gameHistory: ObjectId(gameid), ticketid: { $in: ticketIds } },
      { $set: { userid: ObjectId(userid), booked: true } },
    );

    gameHis.totalBookedTicket = gameHis.totalBookedTicket + 1;
    await gameHis.save();

    response.status = 1;
    response.user = user;
    response.message = 'Booking done.js';

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};

export const tambolaBookMultipleSets = async (reqtData) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in tambola booking multiple sets',
  };

  try {
    let cuDate = new Date();
    cuDate.setHours(0, 0, 0);

    let gameid = reqtData.gameid;
    let username = reqtData.username;
    let ticketSets = reqtData.ticketSets;

    // Tambola Game ID
    let tambolaGameId = ObjectId('64410e6ed3a7eca8ad628ff3');

    // Get user
    let user = await User.findOne({ username });

    if (!user) {
      response.message = 'User does not exists..js';
      return response;
    }

    // Tambola Game History
    let gameHis = await TambolaGameHistory.findOne({ gameHistory: ObjectId(gameid) });

    let amountRequired = gameHis.ticketPrice * ticketSets.length;

    if (user.boat != true && user.coins < amountRequired) {
      response.message = 'Insufficient Balance.js';
      return response;
    }

    let ticketids = [];

    if (ticketSets) {
      for (const singleSet of ticketSets) {
        let endSetNumber = singleSet * gameHis.ticketSet;
        let startSetNumber = endSetNumber - gameHis.ticketSet + 1;

        for (let counter = startSetNumber; counter <= endSetNumber; counter++) {
          ticketids.push(counter);
        }
      }
    }

    let bettingData = {
      name: 'Tambola ticket sets',
      amount: amountRequired,
      numbers: ticketids,
      winning: 0,
      win_status: false,
      user: ObjectId(user.id),
      // need to enter betting_type
      game: tambolaGameId,
      game_history: gameHis.gameHistory,
      tokens: [],
      status: 'completed',
    };

    let betting = await Betting.create(bettingData);

    if (user.boat != true) {
      user.coins = user.coins - betting.amount;
    }

    user.betting_points = user.betting_points - betting.amount;
    user.daily_play_points = user.daily_play_points - betting.amount;
    user.save();

    if (betting) {
      let transactionData = {
        type: 'SUBTRACT',
        betting_id: betting.id,
        game_history_id: gameHis.gameHistory,
        game_id: tambolaGameId,
        fromUser: user.id,
        trans_coins: betting.amount,
        comment: `Bulk booking Sets are ${ticketSets.toString()}`,
        remaining_coins: user.coins,
      };

      Transaction.create(transactionData);
    }
    await TambolaGameTicket.updateMany(
      { gameHistory: ObjectId(gameid), ticketid: { $in: ticketids } },
      { $set: { userid: ObjectId(user.id), booked: true } },
    );

    gameHis.totalBookedTicket = gameHis.totalBookedTicket + 1;
    await gameHis.save();

    response.status = 1;
    response.user = user;
    response.message = 'Booking done.js';

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};

export const tambolaCancelMultipleSets = async (reqtData) => {
    
  // Default response
    let response = {
      status: 0,
      message: 'Issue in tambola cancel multiple sets',
    };
  
    try {
  
      let gameid = reqtData.gameid;
      let ticketSets = reqtData.ticketSets;
  
      // Tambola Game ID
      let tambolaGameId = ObjectId('64410e6ed3a7eca8ad628ff3');
  
      
      // Tambola Game History
      let gameHis = await TambolaGameHistory.findOne({ gameHistory: ObjectId(gameid) });
  
      let ticketids = [];
  
      if( ticketSets ) {
        for (const singleSet of ticketSets) {
          let endSetNumber = singleSet * gameHis.ticketSet;
          let startSetNumber = endSetNumber - gameHis.ticketSet + 1;
          
          for(let counter = startSetNumber; counter <= endSetNumber; counter++ ) {
            ticketids.push(counter);
          }
        }
      }

      let bettings = await Betting.find({game_history: gameHis.gameHistory, numbers: ticketids, status: 'completed'}).populate('userid');

      let transactionData = [];
      
      for (const singleBet of bettings) {
        
        singleBet.userid.coins = singleBet.userid.coins + singleBet.amount;

        transactionData.push({
          type: 'ADD',
          betting_id: singleBet.id,
          game_history_id: gameHis.gameHistory,
          game_id: tambolaGameId,
          toUser: singleBet.userid.id,
          trans_coins: singleBet.amount,
          comment: `Booking cancelled booking ids ${singleBet.ticketids.toString()}`,
          remaining_coins: singleBet.user.coins
        });

        singleBet.status = 'cancelled.js';
        await singleBet.user.save();
        await singleBet.save();

      }

      await TambolaGameTicket.updateMany({ gameHistory: ObjectId(gameid), ticketid: { $in: ticketids } }, { $set: { userid: null , booked : false } });
      await Transaction.insertMany(transactionData);
      
      
      
      gameHis.totalBookedTicket = gameHis.totalBookedTicket - ticketSets.length;
      await gameHis.save();
      
      response.status = 1;
      response.user = user;
      response.message = 'Booking cancelled done.js';
      
      return response;
  
    } catch (err) {
  
      logger.error(err.message, { metadata: err });
      response.message = err.message || err.toString();
      return response;
  
    }
 
}

export const getTicketsByUserId = async (reqtData) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in game data',
  };

  try {
    let cuDate = new Date();
    cuDate.setHours(0, 0, 0);

    let gameid = reqtData.gameid;
    let userid = reqtData.userid;
    let page = reqtData.page ? reqtData.page : 0;
    let numberOfRecords = 20;

    let skipRecords = page * numberOfRecords;

    // Tambola Game ID
    let tambolaGameId = ObjectId('64410e6ed3a7eca8ad628ff3');

    let tickets = await TambolaGameTicket.find({ gameHistory: ObjectId(gameid), userid: ObjectId(userid) })
      .skip(skipRecords)
      .limit(numberOfRecords);

    response.status = 1;
    response.allTickets = tickets;
    response.message = 'List of tickets.js';

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};

export const getUserByUserId = async (reqtData) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in to get user',
  };

  try {
    let userid = reqtData.userid;
    let user = await User.findById(userid);

    response.status = 1;
    response.user = user;
    response.message = '.js';

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};

export const getBookedTickets = async (reqtData) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in get booked tickets.',
  };

  try {
    let cuDate = new Date();
    cuDate.setHours(0, 0, 0);

    let gameid = reqtData.gameid;

    let totalTickets = await TambolaGameTicket.countDocuments({ gameHistory: ObjectId(gameid), booked: true });

    response.status = 1;
    response.totalTickets = totalTickets;
    response.message = '.js';

    return response;
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return response;
  }
};
