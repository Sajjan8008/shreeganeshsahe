import { Router } from 'express';
import requireJwtAuth from '../../middleware/requireJwtAuth.js';
import TambolaGameHistory from '../../models/TambolaGameHistory.js';
import GameHistory from '../../models/GameHistory.js';
import TambolaTicket from '../../models/TambolaTickets.js';
import TambolaGameTicket from '../../models/TambolaGameTicket.js';
import TambolaReward from '../../models/TambolaReward.js';
import { getLiveFutureGame, getTambolaGamebyId, getBookedTickets,getTambolaAllTicketsByGame, tambolaBookMultipleSets, tambolaCancelMultipleSets } from '../../controllers/tambola'

import Joi from 'joi';
import { gameSchema } from '../../services/validators.js';
import { updateStatus } from '../../services/validators.js';
import { checkpermission, verifyToken } from '../../helper/common.js';
const ObjectId = require('mongoose').Types.ObjectId;
let logger = require('../../services/logger');
const router = Router();

const QUCIK_FIVE = '6447b763369802467f42da91.js';
const QUCIK_SEVEN = '6447b774369802467f42da93.js';
const FOUR_CORNER = '6447b7b0369802467f42db23.js';
const SET_CORNER = '6447b82e369802467f42db77.js';
const TOP_LINE = '6447b842369802467f42db79.js';
const BOTTOM_LINE = '6447b893369802467f42dc20.js';
const MIDDLE_LINE = '6447b89a369802467f42dc22.js';
const FULL_HOUSE = '644ba55dec7aa86e5104ea39.js';
const SECOND_FULL_HOUSE = '6447b903369802467f42dc39.js';

/**
 * Get the listing of Game.
 */
// requireJwtAuth
router.get('/', requireJwtAuth, async (req, res) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in game listing request.',
  };

  try {
    let tambolaHistories = await TambolaGameHistory.find({});

    response.message = 'Tambola Game listing.js';
    response.status = 1;
    response.tambolaHistories = tambolaHistories;

    return res.json(response);
  } catch (err) {
    logger.error(err.message, { metadata: err });
    res.status(500).json({ message: 'Issue in amount listing API.' });
  }
});

router.put('/:id', async (req, res) => {
  // let authstatus = await verifyToken(req);
  // if(authstatus.status == 0) {
  //   return res.status(403).json(authstatus);
  // }

  // let permission = await checkpermission(req.user.role.id,'editGame');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }

  let response = {
    status: 0,
    message: 'Issue in edit tambola game',
  };

  try {

    if( !req.params.id ) {
      response.message = 'Send tambola game id.js';
      return res.json(response);
    }

    // Get game by id
    let tambolaGameHistory = await TambolaGameHistory.findById(req.params.id.trim());

    if(!tambolaGameHistory) {
      response.message = 'Do not find the game with id..js';
      return res.json(response);
    }

    let gameHistory = await GameHistory.findById(tambolaGameHistory.gameHistory);

    if(!gameHistory) {
      response.message = 'Do not find the game with id..js';
      return res.json(response);
    }

    if(req.body.start) {
      let start = new Date(req.body.start)

      tambolaGameHistory.start = start.toISOString();
      gameHistory.start = start.toISOString();

      let betting_allow_time = new Date(start);

      // Closed ticket selling before 5 min.
      betting_allow_time.setMinutes(betting_allow_time.getMinutes() - 5);
      gameHistory.betting_allow_time = betting_allow_time.toISOString();
      await gameHistory.save();



    }

    if(req.body.name) {
      tambolaGameHistory.name = req.body.name;
    }
    
    tambolaGameHistory.videoid = req.body.videoid;
    tambolaGameHistory.jackpotPrice = req.body.jackpotPrice;
    tambolaGameHistory.loop = req.body.loop;
    
    let oldBoxes = tambolaGameHistory.boxes;
    if( req.body.boxes != tambolaGameHistory.boxes ) {
      tambolaGameHistory.boxes = req.body.boxes;
    }
    
    tambolaGameHistory.ticketPrice = req.body.ticketPrice;

    let rewardsIds = [];

    if (req.body.rewards) {
      for (let singleReward of req.body.rewards) {
        if (singleReward) {
          singleReward.status = false;
          singleReward.ticketids = [];
          rewardsIds.push(singleReward);
        }
      }
    }

    tambolaGameHistory.rewards = rewardsIds;

    tambolaGameHistory.status = req.body.status;

    await tambolaGameHistory.save();

    
    if(oldBoxes != tambolaGameHistory.boxes) {
      let tickets = await TambolaTicket.find().sort({ ticketid: 1 }).skip(oldBoxes).limit( tambolaGameHistory.boxes - oldBoxes );
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
    response.status = 1;
    response.tambolaGameHistory = tambolaGameHistory;
    response.message = '.js';

    }

    return res.status(response.status == 1 ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message;
    res.status(500).json(response);
  }
});

// requireJwtAuth
/**
 * Insert new amount
 */
// requireJwtAuth
router.post('/', async (req, res) => {
  // let authstatus = await verifyToken(req);
  // if(authstatus.status == 0) {
  //   return res.status(403).json(authstatus);
  // }

  // let permission = await checkpermission(req.user.role.id,'editGame');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }

  let response = {
    status: 0,
    message: 'Issue in creating tambola game',
  };

  try {
    // Create game
    // Then create tambola game create
    // Create tambola booking tickets table also

    let start = req.body.start;
    start = new Date(start);

    let betting_allow_time = new Date();

    // Closed ticket selling before 5 min.
    betting_allow_time.setMinutes(betting_allow_time.getMinutes() - 5);

    let loop = req.body.loop;
    let boxes = req.body.box;
    let ticketSet = req.body.ticketSet;
    let price = req.body.price;

    // Tambola game ID
    let gameId = ObjectId('64410e6ed3a7eca8ad628ff3');

    let gameHis = await GameHistory.create({
      start: start.toISOString(),
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

    if (req.body.rewards) {
      for (let singleReward of req.body.rewards) {
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
      start: start.toISOString(),
      name: req.body.name,
      numbers: [],
      jackpotNumber: 0,
      jackpotPrice: req.body.jackpotPrice,
      loop: loop,
      ticketSet: ticketSet,
      boxes: boxes,
      ticketPrice: price,
      rewards: rewardsIds,
      videoid:req.body.videoid,
      status: req.body.status ? req.body.status : true,
    });

    if (tambolaGameHistory) {
      response.status = 1;
      response.tambolaGameHistory = tambolaGameHistory;
      response.message = '.js';
    }

    return res.status(response.status == 1 ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message;
    res.status(500).json(response);
  }
});



// draw Number request to receive gameid and number
router.post('/draw-number', async (req, res) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in game listing request.',
  };

  try {
    let number = req.body.number;
    number = parseInt(number);
    let gameHistory = req.body.gameHistory;

    let cuTimeDt = new Date();

    // Todo: check game is live

    // db.getCollection("tambolagametickets").find({gameHistory:ObjectId('644f834d51fb7e2e05f6be26'), numbers: { $elemMatch: {$eq: 05} }});

    // Check for rewards
    let tambolaGameHistory = await TambolaGameHistory.findOne({
      gameHistory: ObjectId(gameHistory),
      start: { $lte: cuTimeDt.toISOString() },
      end: { $exists: false },
    });

    if (!tambolaGameHistory) {
      response.message = 'This game is not live..js';
      return res.json(response);
    }

    let checkAleadyDeclaredNumber = await TambolaGameHistory.findOne({
      gameHistory: ObjectId(gameHistory),
      numbers: number,
    });

    if (checkAleadyDeclaredNumber) {
      response.message = 'This number is already declared..js';
      return res.json(response);
    }

    await TambolaGameTicket.updateMany(
      { gameHistory: ObjectId(gameHistory), numbers: number },
      { $push: { crossed: number } },
    );

    // Get all crossed tickets by current draw number
    let crossedCurrentNumberTickets = await TambolaGameTicket.find({
      gameHistory: ObjectId(gameHistory),
      crossed: number,
    });

    let updateRewards = {};
    for (const signleCroxTkt of crossedCurrentNumberTickets) {
      for (const singleReward of tambolaGameHistory.rewards) {
        // Skip if Rewards already declared
        if (singleReward.status) {
          continue;
        }

        //return res.json(singleReward);
        let reId = String(singleReward._id);
        
        switch (reId) {
          // Quick 5
          case QUCIK_FIVE:
            if (signleCroxTkt.crossed.length == 5) {
              // Qucik five done save this ticket

              if (!(QUCIK_FIVE in updateRewards)) {
                updateRewards[QUCIK_FIVE] = [];
              }
              updateRewards[QUCIK_FIVE].push(signleCroxTkt._id);
            }
            break;

          // Quick 7
          case QUCIK_SEVEN:
            if (signleCroxTkt.crossed.length == 7) {
              // Qucik 7 done save this ticket
              if (!(QUCIK_SEVEN in updateRewards)) {
                updateRewards[QUCIK_SEVEN] = [];
              }
              updateRewards[QUCIK_SEVEN].push(signleCroxTkt._id);
            }

            break;

          // 4 Corner
          case FOUR_CORNER:
            if (signleCroxTkt.crossed.length > 3) {
              let topLineNum = signleCroxTkt.numbers.slice(0, 9);
              topLineNum = topLineNum.filter(Number);
              topLineNum = [topLineNum[0], topLineNum[topLineNum.length - 1]];
              let checkTopCorner = topLineNum.every((elem) => signleCroxTkt.crossed.includes(elem));

              if (checkTopCorner) {
                let bottomLineNum = signleCroxTkt.numbers.slice(18, 27);
                bottomLineNum = bottomLineNum.filter(Number);
                bottomLineNum = [bottomLineNum[0], bottomLineNum[bottomLineNum.length - 1]];
                let isBottomCorner = bottomLineNum.every((elem) => signleCroxTkt.crossed.includes(elem));

                if (isBottomCorner) {
                  // Todo : 4 corner done
                  if (!(FOUR_CORNER in updateRewards)) {
                    updateRewards[FOUR_CORNER] = [];
                  }
                  updateRewards[FOUR_CORNER].push(signleCroxTkt._id);
                }
              }
            }
            break;

          // Set Corner
          case SET_CORNER:
            if (signleCroxTkt.crossed.length > 1) {
              let topLineNumSetCor = signleCroxTkt.numbers.slice(0, 9);
              topLineNumSetCor = topLineNumSetCor.filter(Number);
              topLineNumSetCor = [topLineNumSetCor[0], topLineNumSetCor[topLineNumSetCor.length - 1]];
              let checkTopSetCorner = topLineNumSetCor.every((elem) => signleCroxTkt.crossed.includes(elem));

              if (checkTopSetCorner) {
                let ticketPositionInSheet = signleCroxTkt.ticketid % tambolaGameHistory.ticketSet;

                let otherTicket = [];
                if (ticketPositionInSheet == 1) {
                  otherTicket = signleCroxTkt.ticketid + (tambolaGameHistory.ticketSet - 1);
                } else if (ticketPositionInSheet == 0) {
                  otherTicket = signleCroxTkt.ticketid - (tambolaGameHistory.ticketSet - 1);
                } else {
                  break;
                }

                // Get ticket by ticket id
                let otherTicketQry = await TambolaGameTicket.findOne({
                  gameHistory: ObjectId(gameHistory),
                  ticketid: otherTicket,
                });

                if (otherTicketQry) {
                  let bottomLineNumSetCor = otherTicketQry.numbers.slice(18, 27);
                  bottomLineNumSetCor = bottomLineNumSetCor.filter(Number);
                  bottomLineNumSetCor = [bottomLineNumSetCor[0], bottomLineNumSetCor[bottomLineNumSetCor.length - 1]];
                  let isBottomSetCorner = bottomLineNumSetCor.every((elem) => otherTicketQry.crossed.includes(elem));

                  if (isBottomSetCorner) {
                    // Todo : Set corner done
                    if (!(SET_CORNER in updateRewards)) {
                      updateRewards[SET_CORNER] = [];
                    }

                    if (updateRewards[SET_CORNER].indexOf(signleCroxTkt._id) == -1) {
                      updateRewards[SET_CORNER].push(signleCroxTkt._id);
                    }

                    if (updateRewards[SET_CORNER].indexOf(otherTicketQry._id) == -1) {
                      updateRewards[SET_CORNER].push(otherTicketQry._id);
                    }
                  }
                }
              }
            }

            break;

          // Topline
          case TOP_LINE:
            let topLineNumbers = signleCroxTkt.numbers.slice(0, 9);
            topLineNumbers = topLineNumbers.filter(Number);
            let isTopLineDone = topLineNumbers.every((elem) => signleCroxTkt.crossed.includes(elem));

            if (isTopLineDone) {
              // Do when top line done
              if (!(TOP_LINE in updateRewards)) {
                updateRewards[TOP_LINE] = [];
              }
              updateRewards[TOP_LINE].push(signleCroxTkt._id);
            }
            break;

          // Bottom Line
          case BOTTOM_LINE:
            let bottomLineNumbers = signleCroxTkt.numbers.slice(18, 27);
            bottomLineNumbers = bottomLineNumbers.filter(Number);
            let isBottomLineDone = bottomLineNumbers.every((elem) => signleCroxTkt.crossed.includes(elem));

            if (isBottomLineDone) {
              // Do when bottom line done
              if (!(BOTTOM_LINE in updateRewards)) {
                updateRewards[BOTTOM_LINE] = [];
              }
              updateRewards[BOTTOM_LINE].push(signleCroxTkt._id);
            }
            break;

          // Middle Line
          case MIDDLE_LINE:
            let middleLineNumbers = signleCroxTkt.numbers.slice(9, 18);
            middleLineNumbers = middleLineNumbers.filter(Number);
            let isMiddleLineDone = middleLineNumbers.every((elem) => signleCroxTkt.crossed.includes(elem));

            if (isMiddleLineDone) {
              // Do when middle line done
              if (!(MIDDLE_LINE in updateRewards)) {
                updateRewards[MIDDLE_LINE] = [];
              }
              updateRewards[MIDDLE_LINE].push(signleCroxTkt._id);
            }

            break;

          // Full House
          case FULL_HOUSE:
            if (signleCroxTkt.crossed.length == 15) {
              // Qucik full house save this ticket
              if (!(FULL_HOUSE in updateRewards)) {
                updateRewards[FULL_HOUSE] = [];
              }
              updateRewards[FULL_HOUSE].push(signleCroxTkt._id);
            }

            break;

          // 2nd Full House
          case SECOND_FULL_HOUSE:
            if (signleCroxTkt.crossed.length == 15) {
              // Qucik full house save this ticket
              if (!(SECOND_FULL_HOUSE in updateRewards)) {
                updateRewards[SECOND_FULL_HOUSE] = [];
              }
              updateRewards[SECOND_FULL_HOUSE].push(signleCroxTkt._id);
            }

            break;

          default:
            break;
        }
      }
    }

    if (Object.keys(updateRewards).length > 0) {
      let is2ndFullHouseSelected = 0;

      for (const key in tambolaGameHistory.rewards) {
        if (tambolaGameHistory.rewards[key]._id == SECOND_FULL_HOUSE) {
          is2ndFullHouseSelected = 1;
        }

        if (tambolaGameHistory.rewards[key]._id in updateRewards) {
          if (updateRewards[tambolaGameHistory.rewards[key]._id].length > 0) {
            tambolaGameHistory.rewards[key].ticketids = updateRewards[tambolaGameHistory.rewards[key]._id];
            tambolaGameHistory.rewards[key].status = true;
            tambolaGameHistory.rewards[key].numberby = number;
            
            // If Match with jackpot number
            if(number == tambolaGameHistory.jackpotNumber) {
              tambolaGameHistory.rewards[key].isJackPot = true;
            }
          }
        }
      }

      // Full house id
      let checkingToFinshGame = FULL_HOUSE;

      if (is2ndFullHouseSelected) {
        // 2nd full house
        checkingToFinshGame = SECOND_FULL_HOUSE;
      }

      if (checkingToFinshGame in updateRewards) {
        let curntDate = new Date();

        tambolaGameHistory.end = curntDate.toISOString();
        tambolaGameHistory.pendingTransaction = true;
        let gameHis = await GameHistory.findById(tambolaGameHistory.gameHistory);
        gameHis.end = curntDate.toISOString();
        await gameHis.save();

        // Transaction will happen after 30 seconds of game.
      }
    }

    tambolaGameHistory.updateNumber = true;
    tambolaGameHistory.numbers.push(number);

    await tambolaGameHistory.save();

    response.message = 'Number drawn.js';
    response.status = 1;
    response.jackpot =  number == tambolaGameHistory.jackpotNumber ? true : false;
    response.tambolaGameHistory = tambolaGameHistory;

    return res.json(response);

  } catch (err) {
    logger.error(err.message, { metadata: err });
    res.status(500).json({ message: 'Issue in number drawn.' });
  }
});

// Get live and future games
router.post('/get-live-future', async (req, res) => {
  // let authstatus = await verifyToken(req);
  // if(authstatus.status == 0) {
  //   return res.status(403).json(authstatus);
  // }

  // let permission = await checkpermission(req.user.role.id,'editGame');
  // if( permission.status == 0 ) {
  //   return res.status(403).json(permission);
  // }

  let response = {
    status: 0,
    message: 'Issue in tambola game list.',
  };

  try {
    response = await getLiveFutureGame(req.body);

    return res.json(response);

    return res.status(response.status == 1 ? 200 : 500).json(response);
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message;
    res.status(500).json(response);
  }
});

// Get game details by id
router.post('/game-by-id', async (req, res) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in game data',
  };

  if (!req.body.gameid) {
    response.message = 'Send game id to get tickets.js';
    return res.json(response);
  }

  try {
    response = await getTambolaGamebyId(req.body);

    return res.json(response);
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return res.json(response);
  }
});

// Get game details by id
router.get('/gamevideo/:gamehistory', async (req, res) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in game data',
  };
  
  if (!req.params.gamehistory) {
    response.message = 'Send game id to get video.js';
    return res.json(response);
  }

  try {
   
    let videoQry = await TambolaGameHistory.findOne({gameHistory: ObjectId(req.params.gamehistory.trim())},'videoid')
    
    if( !videoQry ) {
      response.message = 'Dont find any game this id.js';
    return res.json(response);
    }

    if( videoQry.videoid ) {
      response.message = 'Video is not availible..js';
    return res.json(response);
    }
    

    res.setHeader('Content-Type', 'text/html'); //or text/plain
    let content = "<html><head> <meta meta name=\"viewport\" content= \"width=device-width, user-scalable=no\" /> <style> * { margin:0; padding:0; overflow:hidden; } .parent-main{height: 100vh; width: 100%; background: #00000000; } .child{ width:100%; height:100%; position:absolute; z-index:-100; } </style> </head> <body><div class=\"parent-main\"> <div class=\"child\"> <div id=\"player\"></div> </div></div> <script> var tag = document.createElement('script'); tag.src = 'https://www.youtube.com/iframe_api.js'; var firstScriptTag = document.getElementsByTagName('script')[0]; firstScriptTag.parentNode.insertBefore(tag, firstScriptTag); var player; function onYouTubeIframeAPIReady() { player = new YT.Player('player', { height: '100%', width: '100%', videoId: [YOUTUBEID], playerVars: { 'playsinline': 1, 'autoplay':1, 'mute':1, 'controls':0, }, events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange } }); } function onPlayerReady(event) { event.target.playVideo(); } var done = false; function onPlayerStateChange(event) { if (event.data == YT.PlayerState.PLAYING && !done) { setTimeout(stopVideo, 6000); done = true; } } function stopVideo() { } </script> </body> </html>";
    content = content.replace('[YOUTUBEID]', videoQry.videoid);
    return res.send(content);


  } catch (err) {
    console.log(err);
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return res.json(response);
  }
});

// Get booked device
router.post('/ticket-booked', async (req, res) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in game data',
  };

  if (!req.body.gameid) {
    response.message = 'Send game id to get tickets.js';
    return res.json(response);
  }

  try {
    response = await getBookedTickets(req.body);

    return res.json(response);
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return res.json(response);
  }
});

// Get booked device
router.post('/tickets-by-gameid', async (req, res) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in list of tickets in gameid',
  };

  if (!req.body.gameid) {
    response.message = 'Send game id to get tickets.js';
    return res.json(response);
  }

  try {
    response = await getTambolaAllTicketsByGame(req.body);

    return res.json(response);
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return res.json(response);
  }
});

// Get booked device
router.post('/multipleset-booking', async (req, res) => {
  // Default response
  let response = {
    status: 0,
    message: 'Issue in multiple sets',
  };

  if (!req.body.gameid) {
    response.message = 'Send game id to get tickets.js';
    return res.json(response);
  }

  try {
    response = await tambolaBookMultipleSets(req.body);

    return res.json(response);
  } catch (err) {
    logger.error(err.message, { metadata: err });
    response.message = err.message || err.toString();
    return res.json(response);
  }
});

// Get booked device
router.post('/multipleset-cancelled', async (req, res) => {

  // Default response
let response = {
  status: 0,
  message: 'Issue in multiple sets cancelled.',
  
 };

 if(!req.body.gameid) {
  response.message = 'Send game id to get tickets.js';
  return res.json(response);
 }
 
 
  try {
    
     response = await tambolaCancelMultipleSets(req.body);
      
     return res.json(response);
 
  } catch(err) {
 
      logger.error(err.message, {metadata: err});
      response.message = err.message || err.toString();
      return res.json(response);
    
  }
});

// draw Number request to receive gameid and number
router.post('/jackpot-number', async (req, res) => {

  // Default response
  let response = {
    "status": 0,
    "message": "Issue in game listing request."
  };

  try {

    let number = req.body.number;
    number = parseInt(number);
    let gameHistory = req.body.gameHistory;

    let cuTimeDt = new Date();

    // Check for rewards 
    let tambolaGameHistory = await TambolaGameHistory.findOne({ gameHistory: ObjectId(gameHistory) , start:{$lte:cuTimeDt.toISOString() }, end:{$exists: false } });

    if(!tambolaGameHistory) {
      response.message = 'This game is not live..js';
      return res.json(response);
    }

    tambolaGameHistory.jackpotNumber = number;
    tambolaGameHistory.updateNumber = true;
    await tambolaGameHistory.save();
    
    response.message = "JackPot Number drawn";
    response.status = 1;
    response.tambolaGameHistory = tambolaGameHistory;

    return res.json(response);

  } catch (err) {
    logger.error(err.message, { metadata: err });
    res.status(500).json({ message: 'Issue in jackpot number drawn.' });
  }
});

export default router;
