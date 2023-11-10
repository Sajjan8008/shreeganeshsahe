import 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import passport from 'passport';
import { Server } from "socket.io";
import { createBetWithUpdate, repeatBet, updateSocket, usercoinsonaction, updateCurrentUser, ticketGameBuy } from './controllers/bettings.js';
// import { show, sideShowStatus, sideshow, callPack, callChaal, cardSeen, playerConnect, playerDisconnect, refundAndRemoveCurrentRoom, dealerTip } from './controllers/teenpatti.js';
import {getLiveFutureGame, getDateWiseFutureGame, getTambolaGamebyId, getTambolaAllTicketsByGamePerSet, getTambolaAllTicketsByGame, tambolaTicketBooking, getUserByUserId, getTicketsByUserId, getFutureGameDates } from './controllers/tambola.js';
import { BADHINTS } from 'dns';
import sleep from 'system-sleep';

//const app = express();

const httpServer = createServer();
const io = new Server(httpServer, {
  // options
});

// Bodyparser Middleware
//app.use(expresson());
//app.use(express.urlencoded({ extended: true }));

//app.use(passport.initialize());
//require('./services/jwtStrategy');
//require('./services/localStrategy');

const isProduction = process.env.NODE_ENV === 'production';

// DB Config
const dbConnection = isProduction ? process.env.MONGO_URI_PROD : process.env.MONGO_URI_DEV;

let schedule;
// Connect to Mongo
mongoose
  .connect(dbConnection, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('MongoDB Connected...');
    //seedDb();
    refundAndRemoveCurrentRoom();
    schedule = require('./services/socket-schedule');
    schedule.ioObject(io);
    // Todo: Tmp comment 


  })
  .catch((err) => console.log(err));


sleep(3000);

io.on("connection", (socket) => {

  console.log('connection created');

  //socket.on('createBetWithUpdate', createBetWithUpdate);
  // Tambola sockets
  socket.on('getUserObject',async (requestData, callback) => {
    let req = JSON.parse(requestData);
    let response =  await getUserByUserId(req);
    callback(JSON.stringify(response));
  });

  socket.on('getFutureGameDates',async (requestData, callback) => {
    let response =  await getFutureGameDates('');
    callback(JSON.stringify(response));
  });

  socket.on('getBoughtTicketByUserId',async (requestData, callback) => {
    let req = JSON.parse(requestData);
    let response =  await getTicketsByUserId(req);
    callback(JSON.stringify(response));
  });

  // Get all Live games
  socket.on('tambolaLiveFutureGames', async (requestData, callback) => {
    //let req = JSON.parse(requestData);
    let response = await getLiveFutureGame();
    callback(JSON.stringify(response));
  });

  // Get live games from date wise
  socket.on('tambolaDateWiseGames', async (requestData, callback) => {
    let req = JSON.parse(requestData);
    let response = await getDateWiseFutureGame(req);
    callback(JSON.stringify(response));
  });

  // Get game by gameHistory id
  socket.on('tambolaGameById', async (requestData, callback) => {

    let response = {
      status: 0,
      message: 'Issue in get game by id'
    };

    if (!requestData) {
      response.message = 'Please provide all information.'
      return callback(response);
    }

    let req = JSON.parse(requestData);

    response = await getTambolaGamebyId(req);


    callback(JSON.stringify(response));
  });

  // Get tambola all tickets with pagination
  socket.on('tambolaGetAllTickets', async (requestData, callback) => {

    let response = {
      status: 0,
      message: 'Issue in get game by id'
    };

    if (!requestData) {
      response.message = 'Please provide all information.'
      return callback(response);
    }

    let req = JSON.parse(requestData);
    
    response = await getTambolaAllTicketsByGame(req);
    
    //let response = await getTambolaAllTicketsByGameHisId(requestData);
    callback(JSON.stringify(response));
  });

  // Get tickets per set and pagination
  socket.on('tambolaGetAllTicketsPerSet', async (requestData, callback) => {

    let response = {
      status: 0,
      message: 'Issue in get game by id'
    };

    if (!requestData) {
      response.message = 'Please provide all information.'
      return callback(response);
    }

    let req = JSON.parse(requestData);
    
    response = await getTambolaAllTicketsByGamePerSet(req);
    
    //let response = await getTambolaAllTicketsByGameHisId(requestData);
    callback(JSON.stringify(response));
  });

  // Ticket booking
  socket.on('tambolaTicketBooking', async (requestData, callback) => {

    let response = {
      status: 0,
      message: 'Issue in get game by id'
    };

    if (!requestData) {
      response.message = 'Please provide all information.'
      return callback(response);
    }

    let req = JSON.parse(requestData);
    
    response = await tambolaTicketBooking(req);
    
    //let response = await getTambolaAllTicketsByGameHisId(requestData);
    callback(JSON.stringify(response));
  });

  socket.on('createBetWithUpdate', async (requestData, callback) => {
    await createBetWithUpdate(requestData, socket, io, (response) => {
      callback(response);
    });
  });

  socket.on('updateCurrentUser', async (requestData, callback) => {
    await updateCurrentUser(requestData, (response) => {
      callback(response);
    });
  });

  socket.on('ticketgamebuy', async (requestData, callback) => {
    await ticketGameBuy(requestData, (response) => {
      callback(response);
    });
  });


  socket.on('repeatbet', async (requestData, callback) => {
    await repeatBet(requestData, socket, io, (response) => {
      callback(response);
    });
  });

  socket.on('usercoinson', usercoinsonaction);

  // TeenPatti code starts here
  socket.on('teenpatti_player_connect', async (requestData, callback) => {
    await playerConnect(requestData, socket, io, (response) => {
      callback(response);
    });
  });

  // TeenPatti code starts here
  socket.on('teenpatti_player_disconnect', async (requestData, callback) => {
    await playerDisconnect(socket, io, (response) => {
      callback(response);
    });
  });

  socket.on('teenpatti_cardseen', async (requestData, callback) => {
    await cardSeen(socket, io, (response) => {
      callback(response);
    });
  });


  socket.on('teenpatti_callchaal', async (requestData, callback) => {
    await callChaal(requestData, socket, io, (response) => {
      callback(response);
    });

  });

  socket.on('teenpatti_tip', async (requestData, callback) => {
    await dealerTip(requestData, socket, io, (response) => {
      callback(response);
    });

  });


  socket.on('teenpatti_callpack', async (requestData, callback) => {
    await callPack(socket, io, (response) => {
      callback(response);
    });
  });

  socket.on('teenpatti_sideshow', async (requestData, callback) => {
    await sideshow(socket, io, (response) => {
      callback(response);
    });
  });

  socket.on('teenpatti_sideshow_status', async (requestedData, callback) => {
    await sideShowStatus(requestedData, socket, io, (response) => {
      callback(response);
    });
  });

  socket.on('teenpatti_show', async (requestData, callback) => {
    await show(socket, io, (response) => {
      callback(response);
    });
  });

  //SIDESHOW
  //socket.on('doublebet',doubleBet);
  socket.on("disconnect", async (reason) => {
    await playerDisconnect(socket, io, (response) => {
      console.log(response);
      console.log('Disconnect call');
    });
  });
});

const port = 6000;
httpServer.listen(port, () => console.log(`Server started on port ${port}`));
