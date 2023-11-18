import mongoose from 'mongoose';
import GameHistory from './GameHistory.js';
import Betting from './Betting.js';
import GameCurrentUser from './GameCurrentUser.js';
import Sets from './Sets.js';
import NumberXProfit from './NumberXProfit.js';
import {
  updateWallet
} from '../helper/wallet.js';
import NumberSet from './NumberSet.js';
import Transaction from './Transaction.js';
import User from './User.js';
import Setting from './Setting.js';
import GameConnectBoat from './GameConnectBoat.js';
  const  ObjectId  = mongoose.Schema.Types.ObjectId;
const {
  Schema
} = mongoose;

// import logger from '../services/logger.js';

const NumberBettingHistorySchema = new Schema({
  number: {
    type: String,
    required: [true, "can't be blank"],
  },
  game_history_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameHistory'
  },
  betamount: {
    type: Number,
    required: [true, "can't be blank"],
  },
  wincoins_if_draw_this_number: {
    type: Number,
    required: [true, "can't be blank"],
  }
}, {
  timestamps: true
}, );



NumberBettingHistorySchema.methods.toJSON = function () {

  return {
    id: this._id,
    number: this.number,
    game_history_id: this.game_id,
    wincoins_if_draw_this_number: this.wincoins_if_draw_this_number,
    betamount: this.betamount
  };
};

NumberBettingHistorySchema.methods.tripleChance = async (settings, game, callback) => {


  /* Number settings
    1. Random number
    2. Minimum betting number
    3 for betting percenatage
  */
  let response = {
    'status': 0,
    'message': 'Issue in update number request'
  };

  let numberDrawSettings, winningPercenatage, numberDocument, winners = [],
    gameId = '', jackpot, jackPotInerval, jackpotProfit, preSelectNumber = '.js';

    gameId = settings['TRIPLE_CHANCE_GAME_ID'];

    numberDrawSettings = parseInt(settings['triplechance_number_draw']);
    winningPercenatage = parseInt(settings['triplechance_game_winning_profit']);;

    // JackPot settings
    jackpot = parseInt(settings['triplechance_jackpot']);
    jackPotInerval = parseInt(settings['triplechance_jackpot_time']);
    jackpotProfit = parseInt(settings['triplechance_jackpot_profit']);


  let finalBetUsers = await GameCurrentUser.findOne({gameid:gameId}).exec();
  
  let d = new Date();
  
  let gameHistory = await GameHistory.findOne({
    game: ObjectId(gameId),
    betting_allow_time: {
      $lte: d.toISOString()
    },
    end: {
      $gt: d.toISOString()
    },
    number: {
      $exists: false
    }
  }).exec();
  
  if (gameHistory != null) {

    let startTime = new Date(gameHistory.start);
    //let betTime = new Date(gameHistory.betting_allow_time);

    let numberSet = await NumberSet.findOne({
      gameid: game,
      updatedAt: {
        $gte: startTime.toISOString()
      }
    }).exec();

    if (numberSet != null) {
      preSelectNumber = numberSet.number;
    }

    try {

        let selectedNumber,numberDocuments;
          let loop = 1, totalSum = 0, triple, double, single;

          if (!preSelectNumber) {  
        switch (numberDrawSettings) {
            
          case 3:

          let approxWinningAmount = gameHistory.total_betting * (winningPercenatage / 100);

          while( loop ) {

            totalSum = 0;
            selectedNumber = Math.floor(Math.random() * (999 - 0 + 1) + 0);
            selectedNumber = ('000' + selectedNumber).slice(-3);
           triple = selectedNumber;
           double = String(selectedNumber).slice(-2);
           single = String(selectedNumber).slice(-1);

           // Checking triple double single winning amount
           numberDocuments = await NumberBettingHistory.find({
            game_history_id: gameHistory._id,
            number:{$in:[triple,double,single]},
          }).exec();


          for (const singleDocument of numberDocuments) {
            totalSum = totalSum + singleDocument.wincoins_if_draw_this_number;
          }

          if( totalSum <= approxWinningAmount ) {
            loop = 0;
          }

          }
            break;
          default:
           selectedNumber = Math.floor(Math.random() * (999 - 0 + 1) + 0);
           selectedNumber = ('000' + selectedNumber).slice(-3);
           triple = selectedNumber;
           double = String(selectedNumber).slice(-2);
           single = String(selectedNumber).slice(-1);

           // Checking triple double single winning amount
           numberDocuments = await NumberBettingHistory.find({
            game_history_id: gameHistory._id,
            number:{$in:[triple,double,single]},
          }).exec();

          for (const singleDocument of numberDocuments) {
            totalSum = totalSum + singleDocument.wincoins_if_draw_this_number;
          }
        }
      } else {
        selectedNumber = preSelectNumber;

           selectedNumber = ('000' + selectedNumber).slice(-3);
           triple = selectedNumber;
           double = String(selectedNumber).slice(-2);
           single = String(selectedNumber).slice(-1);

           // Checking triple double single winning amount
           numberDocuments = await NumberBettingHistory.find({
            game_history_id: gameHistory._id,
            number:{$in:[triple,double,single]},
          }).exec();

          for (const singleDocument of numberDocuments) {
            totalSum = totalSum + singleDocument.wincoins_if_draw_this_number;
          }
      }

      if (gameHistory.jackpot == 0 && jackpot == 1) {

        // Set 30 minutes default if jackpot in not set 
        if (!jackPotInerval) {
          jackPotInerval = 30;
        }

      
        // Set init values
        let currentTimeCompare = new Date();

        currentTimeCompare.setMinutes(currentTimeCompare.getMinutes() - jackPotInerval);
        let timeForJackPot = currentTimeCompare.toISOString();

        let checkForJackPot = await GameHistory.findOne({
          game: ObjectId(gameId),
          "start": {
            $gte: timeForJackPot
          },
          "jackpot": {
            $ne: 0
          }
        });

        if (!checkForJackPot) {
          gameHistory.jackpot = parseInt(jackpotProfit);
         
     
          // Dynamic jackpot in two intervals
         let gameTypeJackPotTime = 'triplechance_jackpot_time.js';
         

         if(gameTypeJackPotTime) {
           
         let jkNewInterval = Math.floor(Math.random() * (parseInt(settings['jackpot_max']) - parseInt(settings['jackpot_min'])) + parseInt(settings['jackpot_min']))
         await Setting.updateOne({
          name: gameTypeJackPotTime
        }, {
          value: String(jkNewInterval)          
        });   
        }

        }

      }

      gameHistory.number = triple;
      // gameHistory.total_winning = numberDocument.wincoins_if_draw_this_number;
      gameHistory.betting_open = false;
      await gameHistory.save();

      
      //let bettings = await Betting.find({'game_history' : gameHistory._id,'numbers':{$in :  [luckyDrawNumber]}}).exec();

      let bettings = await Betting.find({
        'game_history': gameHistory._id,
        status: 'completed'
      }).exec();

      let userBets = {};
      let removeBetUsers = {};

      for (let singleBet of bettings) {
        if (userBets[singleBet.user] === undefined) {
          userBets[singleBet.user] = {};
          userBets[singleBet.user]['betamount'] = 0;
          userBets[singleBet.user]['winamount'] = 0;
          userBets[singleBet.user]['user'] = singleBet.user;
          userBets[singleBet.user]['game_history'] = singleBet.game_history;
          userBets[singleBet.user]['game'] = singleBet.game;
          userBets[singleBet.user]['ticket_id'] = singleBet.ticket_id;
        }

        userBets[singleBet.user]['betamount'] += singleBet.amount;

        if( !finalBetUsers.users.includes(singleBet.user) && singleBet.ticket_id == 0  ) {
          
          if(removeBetUsers[singleBet.user] === undefined) {
            removeBetUsers[singleBet.user] = singleBet.amount;
          } else {
            removeBetUsers[singleBet.user] += singleBet.amount;
          }

          await singleBet.remove();

          continue;
        } else if (singleBet.numbers.includes(triple) || singleBet.numbers.includes(double) || singleBet.numbers.includes(single)) {

          if (gameHistory.jackpot) {
            singleBet.winning = parseInt(singleBet.winning * gameHistory.jackpot);
          }

          //
            singleBet.win_status = true;
            await singleBet.save();
        
          
          userBets[singleBet.user]['winamount'] += singleBet.winning;
        }
      }
      
      if( Object.keys(removeBetUsers).length ) {
        logger.info( gameHistory._id, { metadata:removeBetUsers });
      }

let allUserIds = Object.keys(userBets);
let transactionData = [] ,user;

for  (let userBetKey of allUserIds) {

  user = await User.findById(userBetKey).exec();

  if(!finalBetUsers.users.includes(userBetKey) && userBets[userBetKey]['ticket_id'] == 0 ) {
    user.coins = user.coins + userBets[userBetKey]['betamount'];
    user.daily_play_points = user.daily_play_points - userBets[userBetKey]['betamount'];

    if( user.daily_play_points < 0 ) {
      user.daily_play_points = 0;
    }

    await user.save();
    continue;
  }

    transactionData.push({
        type: "SUBTRACT",
        fromUser: userBetKey,
        game_history_id: userBets[userBetKey]['game_history'],
        game_id: userBets[userBetKey]['game'],
        trans_coins: userBets[userBetKey]['betamount'],
        comment: 'Subtract for playing',
        remaining_coins: user.coins
    });

  
  // Add wallet amount
  if(userBets[userBetKey]['winamount'] > 0) {
    
    winners.push(userBetKey);

    let day = new Date();
    
    if (user.play_point_update == day.getDay()) {
          
          user.daily_winning_points += userBets[userBetKey]['winamount']; 
     
        } else {
          user.daily_winning_points = userBets[userBetKey]['winamount'];
        }

    user.winning = user.winning + userBets[userBetKey]['winamount'];     
    user.coins += userBets[userBetKey]['winamount'];
    await user.save();

    transactionData.push ( {
        type: "ADD",
        toUser: userBetKey,
        game_history_id: userBets[userBetKey]['game_history'],
        game_id: userBets[userBetKey]['game'],
        trans_coins: userBets[userBetKey]['winamount'],
        comment: 'Add for winning',
        remaining_coins: user.coins
    });

    //let winAmountTransfer = await updateWallet('ADD', 0, userBetKey, 0, userBets[userBetKey]['winamount'], userBets[userBetKey]['game_history'], userBets[userBetKey]['game'], 'Transfer for betting win',function(resp){
     // return resp;
    //});

  }

}

await GameCurrentUser.updateOne({ _id: finalBetUsers._id }, { $set: { users: [] } });

await Transaction.insertMany(transactionData);


      let game_total_winning = totalSum;

      if (gameHistory.jackpot) {
        game_total_winning = (totalSum * gameHistory.jackpot);
      }

      let gameHisUpdate = await GameHistory.updateOne({
        _id: gameHistory._id
      }, {
        winners: winners,
        total_winning: game_total_winning
      });
     
      response.status = 1;
      response.message = 'Number updated.js';
      response.gamehistoryid = gameHistory.id;
      response.jackpot = gameHistory.jackpot;
      response.winning_total = gameHistory.total_winning;
      response.number = [triple,double,single]; 
      response.inner = parseInt(String(triple).slice(-1));
      response.middle = parseInt(String(triple).slice(1,-1));
      response.outside = parseInt(String(triple).slice(0,1));
    
    } catch (err) {

      logger.error(err.message, {metadata: err});    
 response.message = err.message || err.toString();
      

    }

  } else {

    response.message = "Game is not avalible for draw number";

  }

  callback(response);
};

NumberBettingHistorySchema.methods.drawNumber = async (settings, game, callback) => {


  /* Number settings
    1. Random number
    2. Minimum betting number
    3 for betting percenatage
  */
  let response = {
    'status': 0,
    'message': 'Issue in update number request'
  };

  let numberDrawSettings, winningPercenatage, numberDocument, winners = [],
    luckyDrawNumber, gameId = '',
    allNumber = [];
  //JackPot settings
  let jackpot, jackPotInerval, jackpotProfit, preSelectNumber = '.js';

  if (game == 'roulette') {
    allNumber = [
      "00", "0",
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
      "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24",
      "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"
    ];

    gameId = settings['ROLLETE_GAME_ID'];

    numberDrawSettings = parseInt(settings['roulte_number_draw']);
    winningPercenatage = parseInt(settings['roulte_game_winning_profit']);;

    // JackPot settings
    jackpot = parseInt(settings['roulte_jackpot']);
    jackPotInerval = parseInt(settings['roulte_jackpot_time']);
    jackpotProfit = parseInt(settings['roulte_jackpot_profit']);

  } else if (game == 'luckycard') {

    allNumber = [
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
    ];

    gameId = settings['Lucky_Card_GAME_ID'];

    numberDrawSettings = parseInt(settings['lucky_number_draw']);
    winningPercenatage = parseInt(settings['luckycard_game_winning_profit']);

    // JackPot settings
    jackpot = parseInt(settings['luckycard_jackpot']);
    jackPotInerval = parseInt(settings['luckycard_jackpot_time']);
    jackpotProfit = parseInt(settings['luckycard_jackpot_profit']);

  } else if (game == 'card52') {

    allNumber = [
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
      "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24",
      "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36",
      "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48","49", "50", "51", "52"
    ];

    gameId = settings['CARDSFIFTYTWO_GAME_ID'];

    numberDrawSettings = parseInt(settings['52cards_number_draw']);
    winningPercenatage = parseInt(settings['52cards_game_winning_profit']);

    // JackPot settings
    jackpot = parseInt(settings['52cards_jackpot']);
    jackPotInerval = parseInt(settings['52cards_jackpot_time']);
    jackpotProfit = parseInt(settings['52cards_jackpot_profit']);
  
  } else if (game == 'spintowin') {

    allNumber = [
      "0","1", "2", "3", "4", "5", "6", "7", "8", "9"
    ];

    gameId = settings['SPIN_TO_WIN_GAME_ID'];

    numberDrawSettings = parseInt(settings['spintowin_number_draw']);
    winningPercenatage = parseInt(settings['spintowin_game_winning_profit']);

    // JackPot settings
    jackpot = parseInt(settings['spintowin_jackpot']);
    jackPotInerval = parseInt(settings['spintowin_jackpot_time']);
    jackpotProfit = parseInt(settings['spintowin_jackpot_profit']);

  } else if(game == 'dragonvstiger') {
    
    allNumber = [
      "1", "3"
    ];

    let rndNo = (Math.floor(Math.random() * 100) + 0);
    let setTieIntoAllNumber = rndNo > 90 ? 1 : 0;

    if( setTieIntoAllNumber ) {
      allNumber.push("2");
    }

    gameId = settings['DRAGON_VS_TIGER_ID'];

    numberDrawSettings = parseInt(settings['dragon_vs_tiger_number_draw']);

    if(rndNo < 51) {
      numberDrawSettings = 1;
    } else {
      numberDrawSettings = 3;
    }

    winningPercenatage = parseInt(settings['dragon_vs_tiger_game_winning_profit']);

    // JackPot settings
    jackpot = 0;
  }  else {

    //

    response.message = 'Please provide game.'
    return response;

  }

  let finalBetUsers = await GameCurrentUser.findOne({gameid:gameId}).exec();

  

  let numberDocuments;

  let d = new Date();

  let gameHistory = await GameHistory.findOne({
    game: ObjectId(gameId),
    betting_allow_time: {
      $lte: d.toISOString()
    },
    end: {
      $gt: d.toISOString()
    },
    number: {
      $exists: false
    }
  }).exec();

  if (gameHistory) {

    let startTime = new Date(gameHistory.start);
    //let betTime = new Date(gameHistory.betting_allow_time);

    let numberSet = await NumberSet.findOne({
      gameid: game,
      updatedAt: {
        $gte: startTime.toISOString()
      }
    }).exec();

    if (numberSet != null) {
      preSelectNumber = numberSet.number;
    }

    if(gameHistory.total_betting > 0 && game == 'dragonvstiger') {
        
      numberDocuments = await NumberBettingHistory.find({
              game_history_id: gameHistory._id,
              betamount : 0,
              number : '2'
            }).exec();

     if(numberDocuments) {
     
      let rndNo1 = (Math.floor(Math.random() * 100) + 0);

      if( rndNo1 < 31 ) {
        preSelectNumber = 2;
      }
     }       
    }

    try {

      // { 'number': luckyDrawNumber, 'betting_open': false }
      // Game is running
      if (!preSelectNumber) {

        // allNumber
        let filters = {
          game_history_id: gameHistory._id,

        }

        if(game == 'dragonvstiger'){
          filters.number = {$in : allNumber}
        }

        switch (numberDrawSettings) {
          case 2:

            let checkingMinimumAmount = await NumberBettingHistory.find(filters).sort({
              wincoins_if_draw_this_number: 1
            }).limit(1).exec();

            let minimumAmount = checkingMinimumAmount[0].wincoins_if_draw_this_number;



            numberDocuments = await NumberBettingHistory.find({
              game_history_id: gameHistory._id,
              wincoins_if_draw_this_number : minimumAmount
            }).exec();


            numberDocument = numberDocuments[Math.floor(Math.random() * numberDocuments.length)];
            luckyDrawNumber = numberDocument.number;
            break;
            
          case 3:

            let approxWinningAmount = gameHistory.total_betting * (winningPercenatage / 100);

            filters.wincoins_if_draw_this_number =  {$lte: parseFloat(approxWinningAmount)};
            numberDocuments = await NumberBettingHistory.find(filters).sort({
              wincoins_if_draw_this_number: -1
            }).exec();

            
            let checkWinAmount;

            if (numberDocuments.length) {
              checkWinAmount = numberDocuments[0].wincoins_if_draw_this_number;
            } else {

              filters.wincoins_if_draw_this_number =  {$gt: parseFloat(approxWinningAmount)};

              numberDocuments = await NumberBettingHistory.find(filters).sort({
                wincoins_if_draw_this_number: 1
              }).exec();

              checkWinAmount = 0;
              
              if (numberDocuments.length) {
                checkWinAmount = numberDocuments[0].wincoins_if_draw_this_number;
              }
            }


            let allNumberWithSameAmount = numberDocuments.filter(function (singleDoc) {
              return singleDoc.wincoins_if_draw_this_number == checkWinAmount;
            });

            // Select number 
            numberDocument = allNumberWithSameAmount[Math.floor(Math.random() * allNumberWithSameAmount.length)];

            // if (allNumberWithSameAmount.length < 3) {
            //   numberDocument = numberDocuments[Math.floor(Math.random() * numberDocuments.length)];
            // } else {
            //   numberDocument = allNumberWithSameAmount[Math.floor(Math.random() * allNumberWithSameAmount.length)];
            // }


            //numberDocuments
            luckyDrawNumber = numberDocument.number;

            break;
          default:
            luckyDrawNumber = allNumber[Math.floor(Math.random() * allNumber.length)];

            numberDocument = await NumberBettingHistory.findOne({
              game_history_id: gameHistory._id,
              number: luckyDrawNumber
            }).exec();
        }
        
      } else {


        luckyDrawNumber = preSelectNumber;

        numberDocument = await NumberBettingHistory.findOne({
          game_history_id: gameHistory._id,
          number: luckyDrawNumber
        }).exec();
      }

      if (gameHistory.jackpot == 0 && jackpot == 1) {

        // Set 30 minutes default if jackpot in not set 
        if (!jackPotInerval) {
          jackPotInerval = 30;
        }

        
        // Set init values
        let currentTimeCompare = new Date();

        currentTimeCompare.setMinutes(currentTimeCompare.getMinutes() - jackPotInerval);
        let timeForJackPot = currentTimeCompare.toISOString();

        let checkForJackPot = await GameHistory.findOne({
          game: ObjectId(gameId),
          "start": {
            $gte: timeForJackPot
          },
          "jackpot": {
            $ne: 0
          }
        });

        if (!checkForJackPot) {
          gameHistory.jackpot = parseInt(jackpotProfit);
         
     
          // Dynamic jackpot in two intervals
          let gameTypeJackPotTime = '.js';
         if( game == 'roulette' ) {
          gameTypeJackPotTime = 'roulte_jackpot_time.js';
         }

         if( game == 'luckycard' ) {
          gameTypeJackPotTime = 'luckycard_jackpot_time.js';
         }

         if( game == 'card52' ) {
          gameTypeJackPotTime = '52cards_jackpot_time.js';
         }

         if( game == 'spintowin' ) {
          gameTypeJackPotTime = 'spintowin_jackpot_time.js';
         }

         
         if(gameTypeJackPotTime) {
           
         let jkNewInterval = Math.floor(Math.random() * (parseInt(settings['jackpot_max']) - parseInt(settings['jackpot_min'])) + parseInt(settings['jackpot_min']))
         await Setting.updateOne({
          name: gameTypeJackPotTime
        }, {
          value: String(jkNewInterval)          
        });   
        }

        }

      }

      gameHistory.number = numberDocument.number;
      gameHistory.betting_open = false;
      await gameHistory.save();

      
      //let bettings = await Betting.find({'game_history' : gameHistory._id,'numbers':{$in :  [luckyDrawNumber]}}).exec();

      let bettings = await Betting.find({
        'game_history': gameHistory._id,
        status: 'completed'
      }).exec();

      let userBets = {};

      let removeBetUsers = {};

      for (let singleBet of bettings) {
        if (userBets[singleBet.user] === undefined) {
          userBets[singleBet.user] = {};
          userBets[singleBet.user]['betamount'] = 0;
          userBets[singleBet.user]['winamount'] = 0;
          userBets[singleBet.user]['user'] = singleBet.user;
          userBets[singleBet.user]['game_history'] = singleBet.game_history;
          userBets[singleBet.user]['game'] = singleBet.game;
          userBets[singleBet.user]['ticket_id'] = singleBet.ticket_id;
        }

        userBets[singleBet.user]['betamount'] += singleBet.amount;

        if( !finalBetUsers.users.includes(singleBet.user) && singleBet.ticket_id == 0 && singleBet.byBoat != true ) {
          if(removeBetUsers[singleBet.user] === undefined) {
            removeBetUsers[singleBet.user] = singleBet.amount;
          } else {
            removeBetUsers[singleBet.user] += singleBet.amount;
          }
          
          await singleBet.remove();
          continue;
        } else if (singleBet.numbers.includes(luckyDrawNumber)) {

          if (gameHistory.jackpot) {
            singleBet.winning = parseInt(singleBet.winning * gameHistory.jackpot);
          }

          //
            singleBet.win_status = true;
            await singleBet.save();
        
          
          userBets[singleBet.user]['winamount'] += singleBet.winning;
        }

        // Update for half return amount
        // if(luckyDrawNumber == 2 && gameId == settings['DRAGON_VS_TIGER_ID']) {

        //   if(singleBet.numbers[0] == 1 || singleBet.numbers[0] == 3) {
        //     userBets[singleBet.user]['winamount'] = userBets[singleBet.user]['winamount'] +  ( singleBet.amount / 2 );
        //   }
        // }
      }

      if( Object.keys(removeBetUsers).length ) {
        logger.info( gameHistory._id, { metadata:removeBetUsers });
      }

let allUserIds = Object.keys(userBets);
let transactionData = [] ,user;
let boatWinningAmount = 0;
for  (let userBetKey of allUserIds) {

  user = await User.findById(userBetKey).exec();

  if(user.boat == true) {
    boatWinningAmount = userBets[userBetKey]['winamount'];
    continue;
  }
  
  if(!finalBetUsers.users.includes(userBetKey) && userBets[userBetKey]['ticket_id'] == 0 ) {
    user.coins = user.coins + userBets[userBetKey]['betamount'];
    user.daily_play_points = user.daily_play_points - userBets[userBetKey]['betamount'];

    if( user.daily_play_points < 0 ) {
      user.daily_play_points = 0;
    }

    await user.save();
    continue;
  }

    transactionData.push({
        type: "SUBTRACT",
        fromUser: userBetKey,
        game_history_id: userBets[userBetKey]['game_history'],
        game_id: userBets[userBetKey]['game'],
        trans_coins: userBets[userBetKey]['betamount'],
        comment: 'Subtract for playing ' + game,
        remaining_coins: user.coins
    });

  
  // Add wallet amount
  if(userBets[userBetKey]['winamount'] > 0) {
    
    winners.push(userBetKey);

    let day = new Date();

    if (user.play_point_update == day.getDay()) {
      user.daily_winning_points += userBets[userBetKey]['winamount']; 
 
    } else {
      user.daily_winning_points = userBets[userBetKey]['winamount'];
    }

    user.winning += userBets[userBetKey]['winamount'];

    let winAm = (userBets[userBetKey]['winamount'] * 0.9);
    user.coins += winAm;
    await user.save();

    transactionData.push ( {
        type: "ADD",
        toUser: userBetKey,
        game_history_id: userBets[userBetKey]['game_history'],
        game_id: userBets[userBetKey]['game'],
        trans_coins: winAm,
        comment: 'Add for winning ' + game,
        remaining_coins: user.coins
    });

    //let winAmountTransfer = await updateWallet('ADD', 0, userBetKey, 0, userBets[userBetKey]['winamount'], userBets[userBetKey]['game_history'], userBets[userBetKey]['game'], 'Transfer for betting win',function(resp){
     // return resp;
    //});

  }
  
}

if(transactionData.length) {
  await Transaction.insertMany(transactionData);
}



      let game_total_winning = numberDocument.wincoins_if_draw_this_number;

      if (gameHistory.jackpot) {
        game_total_winning = (numberDocument.wincoins_if_draw_this_number * gameHistory.jackpot);
      }

      let gameHisUpdate = await GameHistory.updateOne({
        _id: gameHistory._id
      }, {
        winners: winners,
        total_winning: game_total_winning
      });

      await GameConnectBoat.updateOne({gameid:gameHistory._id}, { $set: {totalUser: 0 }});
     
      response.status = 1;
      response.message = 'Number updated.js';
      response.gamehistoryid = gameHistory.id;
      response.number = gameHistory.number; 
      response.boatWinningAmount = boatWinningAmount;
     
      await GameCurrentUser.updateOne({ _id: finalBetUsers._id }, { $set: { users: [] } });  

    } catch (err) {

 logger.error(err.message, {metadata: err});     
 response.message = err.message || err.toString();
      

    }

  } else {

    response.message = "Game is not avalible for draw number";

  }

  callback(response);
};

const NumberBettingHistory = mongoose.model('NumberBettingHistory', NumberBettingHistorySchema);

export default NumberBettingHistory;
