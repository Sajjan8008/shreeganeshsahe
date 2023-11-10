import Boot from "../models/Boot.js";
import GameHistory from "../models/GameHistory.js";
import Room from "../models/Room.js";
import PlayingData from "../models/PlayingData.js";
import User from "../models/User.js";
import Betting from "../models/Betting.js";
import Transaction from "../models/Transaction.js";

// var _ = require("lodash");
var cards = require("../helper/card");
let logger = require('../services/logger');
const ObjectId = require('mongoose').Types.ObjectId;
import 'dotenv';
const env = process.env;

const gameId = env.TEENPATTI_GAME_ID;


const maxBlind = 4;
const bettingTime = 10;
// import {
//     teenPattiWalletAndBetting,
// 	teenPattiActiveBoats,ParseFloat,settingsData
//   } from '../helper/common.js';
// import { isObject } from "lodash.";


let	totalCards = ["Ac","Kc","Qc","Jc","Tc","9c","8c",
		"7c","6c","5c","4c","3c","2c","Ad",
	 "Kd","Qd","Jd","Td","9d","8d","7d",
	 "6d","5d","4d","3d","2d","Ah","Kh",
	 "Qh","Jh","Th","9h","8h","7h","6h",
	 "5h","4h","3h","2h","As","Ks","Qs","Js","Ts","9s","8s","7s","6s",
		"5s","4s","3s","2s"];

// Create room
const playerConnect = async (requestedData,socket, io ,callback) => {

	// Default response
	let response = {
        status: 0,
        message: 'Issue in player connect.',
      };

	  try {

      if(!requestedData) {
          response.message = 'Please provide all information.'
          return callback(response);
      }

	  let req = JSON.parse(requestedData);
  
      if(req.userid == undefined) {
          response.message = 'Please provide user id..js';
          return callback(JSON.stringify(response));
    	}
	 
	  if(req.bootid == undefined) {
			response.message = 'Please provide boot id..js';
			return callback(JSON.stringify(response));
		}

        // Get user
        req.user = await User.findById(req.userid);

		if(!req.user) {
			response.message = 'Please provide valid user id..js';
			return callback(JSON.stringify(response));
		  }

		req.user.current_game = ObjectId(gameId);
		await req.user.save();
		
	   
		// Get boots
		let boot = await Boot.findById(req.bootid);

		if(!boot) {
			response.message = 'Please provide valid boot id..js';
			return callback(JSON.stringify(response));
		}

		if(req.user.coins < boot.minimum_entry ) {
			response.message = 'You have less balance to play game..js';
			return callback(JSON.stringify(response));
		}


		// Find the room if room has lower players 
		let findRoom = 0;

		// Remove user from room.
		let playingDataWithRoom = await PlayingData.find({ userid : ObjectId(req.user.id)}).populate('roomid');

		if(playingDataWithRoom.length) {
			for(let singlePlayer of playingDataWithRoom ) {
				let tmpRoom =  singlePlayer.roomid;

				for(let singleSeat in tmpRoom.seatings) {
					if(tmpRoom.seatings[singleSeat] == req.user.username) {
						tmpRoom.seatings[singleSeat] = '.js';
					}
				}
	
			let userPostion = tmpRoom.users.indexOf(req.user.id);
			if ( userPostion > -1 ) { // only splice array when item is found
				tmpRoom.users.splice(userPostion, 1); // 2nd parameter means remove one item only
			}
			
			tmpRoom.markModified('seatings');
			//singlePlayer.roomid.markModified('singlePlayer.roomid.seatings');
			 await tmpRoom.save();
		}
		
		await PlayingData.deleteMany({ userid : ObjectId(req.user.id)});
		
	}

	let allRooms = await Room.find({});

		if(allRooms.length) {
			for (const singleRoom in allRooms) {
			
				// Check for boot id - means same boot id requested
					if( allRooms[singleRoom].bootid == boot.id ) {
						
						if(	allRooms[singleRoom].users.length < allRooms[singleRoom].maxPlayer ) {
							findRoom = allRooms[singleRoom];
							break;
						}
					}
			}
		}
		

		let room;
		let seating = 1, packed = false, watching = false, waiting = false; 
		
		if(findRoom) {

			room = await Room.findById(findRoom.id);
			
			// Connect existing room
			let i = room.id;
			socket.join(room.id);
			room.users.push(req.user.id);
			
			if(room.users.length >= 2 ) {
				
				if(room.users.length == 2) {
					let currentTime =  new Date();
				currentTime.setSeconds(currentTime.getSeconds() + 5);
				
				let end =  new Date();
				end.setMinutes(currentTime.getMinutes() + 15);

				
				if(room) {

					// Create game
					let gameHistory = await GameHistory.create({
						start: currentTime.toISOString(),
						end: end.toISOString(),
						total_betting: 0,
						total_winning: 0,
						game: gameId,
						jackpot: 0,
					  });

					  if(gameHistory) {
						room.currentgamehistory = gameHistory.id;
					  }

					  room.playtime = currentTime.toISOString();
				}
	
				}
				
			
				for(let singleSeat in room.seatings) {
					if(!room.seatings[singleSeat]) {
						seating = singleSeat;
						room.seatings[singleSeat] = req.user.username;
						break;
					}
				}	
				
			room.markModified('seatings');
			// save it
			await room.save();
			
			if(room.play == 1) {
				watching = true;
				waiting = true;	
			}

			//io.in(i).emit("teenpatti_otherplayer_connect", JSON.stringify(room));

			//io.in(i).emit('teenpatti_otherplayer_connect',JSON.stringify({playStatus :( waiting ? 'Watching': 'Blind'), seat: seating }));
			response.status = 1;

			} else if(room.users.length == 1) {

				room = await Room.findOneAndUpdate({_id:room.id},{
					seatings: {
						1:  req.user.username,
						2:  '',
						3:  '',
						4:  '',
						5:  '',
					},
				users: [
					req.user.id
				],
				bootid : ObjectId(req.bootid),
				currentTurn: 1,
				potValue:0,
				bootValue:boot.bootValue,
				chaalValue:boot.bootValue,
				blindValue:boot.blindValue,
				maxPlayer: boot.maxPlayer,
				shuffle: 0,
				roundCount:0,
				maxBlind: maxBlind,
				potLimit: boot.potLimit,
				chaalLimit:boot.chaalLimit,
				play:0,
				requiredBoat : true,
				alreadyAssignedCards:[],
				completeCardSeen: 0
				},{
					new: true
				  });
			}
			response.status = 1;
			
		} else {

			let currentTime = new Date();

			currentTime.setSeconds( currentTime.getSeconds() + Math.floor(Math.random() * 5) + 1);

			// Create game in game history table
				room = await Room.create({
					seatings: {
							1:  req.user.username,
							2:  '',
							3:  '',
							4:  '',
							5:  '',
						},
					users: [
						req.user.id
					],
					bootid : ObjectId(req.bootid),
					currentTurn: 1,
					potValue:0,
					bootValue:boot.bootValue,
					chaalValue:boot.bootValue,
					blindValue:boot.blindValue,
					maxPlayer: boot.maxPlayer,
					shuffle: 0,
					roundCount:0,
					maxBlind: maxBlind,
					potLimit: boot.potLimit,
					chaalLimit:boot.chaalLimit,
					play:0,
					alreadyAssignedCards:[],
					completeCardSeen: 0,
					requiredBoat : true,
					boatTime : currentTime
				});

				let i = room.id;
				socket.join(i);
				response.status = 1;
				waiting = 0;

		}

		  if(response.status == 1) {
			  response.message = '.js';

			 let alreadyConnectedUsers = await PlayingData.find({roomid:ObjectId(room.id) }).populate('userid'); 

			 let playerData =  await PlayingData.create({
				userid: ObjectId(req.userid),
				socketid:socket.id,
				roomid: room.id,
				chaalValue:boot.bootValue,
				cardseen:false,
				cards : [],
				cardType: '',
				seat: seating,
				watching: watching,
				waiting: waiting,
				packed: packed	
			});
			 
			  response.seat = seating;
			  response.playStatus = waiting && watching ?  'Watching' : 'Blind.js';
			  response.playerData = playerData;
			
			  
		    response.coins = req.user.coins;
			response.username = req.user.username;
			response.photo = req.user.image;
			response.potValue = room.potValue;
			response.dealer = room.lastWinner;
			callback(JSON.stringify(response));

			  if(room.users.length > 1) {

				let alreadyConUsers = [];
				for (const singleUser of alreadyConnectedUsers ) {
					alreadyConUsers.push({
						seat : singleUser.seat,
						username: singleUser.userid.username,
						playStatus: singleUser.watching ? (singleUser.waiting ? 'Watching' : 'Packed') : 'Play',
						cardStatus : singleUser.cardseen,
						photo: singleUser.userid.image,
						watching:  singleUser.watching,
						rising : singleUser.rising,
						sumChaalValue: singleUser.sumChaalValue
					});
				}

				io.to(socket.id).emit('teenpatti_alreadyconnected_users',JSON.stringify(alreadyConUsers));
				// Todo: uncomment next line to make right waiting condition 
				//socket.to(room.id).emit('teenpatti_otherplayer_connect',JSON.stringify({playStatus :( waiting ? 'Watching': 'Blind'), seat: seating, username: req.user.username }));
				socket.to(room.id).emit('teenpatti_otherplayer_connect',JSON.stringify({seat : seating,
					username: req.user.username,
					playStatus: watching ? (waiting ? 'Watching' : 'Packed') : 'Play',
					cardStatus : false,
					photo: req.user.image,
					watching:  watching,
					potValue : room.potValue
				 }));
			}
			
			return;
		}
		  return callback(JSON.stringify(response));

		} catch(err) {
			logger.error(err.message, {metadata: err});
      		response.message = err.message || err.toString();
      		return callback(JSON.stringify(response));
		
		}
	}

const cardSeen = async (socket, io ,callback) => {

	let response = {
			status : 0,
			cards : [], 
			message: 'Issue in card seen'
		}

		try {

		let player = await PlayingData.findOne({socketid:socket.id}).populate(['roomid','userid']);	
		
		if(player) {
			if( !player.cardseen ) {
	
				player.cardseen = true;
				
				let alreadyAssignedCard = player.roomid.alreadyAssignedCards;
				let carDr = cardDraw(alreadyAssignedCard);
				player.cards = carDr;
					
				//alreadyAssignedCard.push(carDr[0], carDr[1], carDr[2]);
				//player.roomid.alreadyAssignedCards = alreadyAssignedCard;
		
				let scoreForCurrentUser = scoreHandsNormal([player.cards[0].toString(), player.cards[1].toString(), player.cards[2].toString()]);
				
				let checkAlreadyHasSameScore = await PlayingData.findOne({roomid:ObjectId(player.roomid.id),score:scoreForCurrentUser.score},'score');
				
				if(checkAlreadyHasSameScore) {
					carDr = cardDraw(alreadyAssignedCard);
					player.cards = carDr;
					
					//alreadyAssignedCard.push(carDr[0], carDr[1], carDr[2]);
					//player.roomid.alreadyAssignedCards = alreadyAssignedCard;
					scoreForCurrentUser = scoreHandsNormal([player.cards[0].toString(), player.cards[1].toString(), player.cards[2].toString()]);
				}

				
				// Check is real user
				if(1) {
					
					let minCheck = player.userid.boat == false ? 9 : 3;

					let rnadm = (Math.floor(Math.random() * 10) + 0)
					
					// If 80 20 rule play here
					// If no comes 1 to 8 then user needs to have very low number
					// if no comes 9 and 10 then user needs to have high number
					let counterCheck = 0;
    				if( rnadm < minCheck && scoreForCurrentUser.score > 1470300 ) {
						while(scoreForCurrentUser.score > 1470300) {
							console.log('Matching score got less',scoreForCurrentUser.score)
							carDr = cardDraw(alreadyAssignedCard);
							scoreForCurrentUser = scoreHandsNormal([carDr[0].toString(), carDr[1].toString(), carDr[2].toString()]);
							player.cards = carDr;
							counterCheck++;
							if(counterCheck == 2) {
								break;
							}
						}
					} else if(rnadm > (minCheck - 1) && scoreForCurrentUser.score <= 1470300) {
						while(scoreForCurrentUser.score < 1470300) {
							console.log('Matching score go for high',scoreForCurrentUser.score)
							carDr = cardDraw(alreadyAssignedCard);
							scoreForCurrentUser = scoreHandsNormal([carDr[0].toString(), carDr[1].toString(), carDr[2].toString()]);
							player.cards = carDr;
							counterCheck++;
							if(counterCheck == 2) {
								break;
							}
						}
					}
				}

				alreadyAssignedCard.push(carDr[0], carDr[1], carDr[2]);
				player.roomid.alreadyAssignedCards = alreadyAssignedCard;
		
				// let scoreForCurrentUser1 = scoreHandsNormal(['AS','AD','AS']);
		
				// console.log('1ST CASE trio AAA',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['KD','KS','KH']);
		
				// console.log('2nd trio CASE kkk',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['AS','KS','QS']);
		
				// console.log('Pure sq CASE AKQ',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['AS','2S','3S']);
		
				// console.log('Pure sq CASE A23',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['KS','QS','JS']);
		
				// console.log('Pure sq CASE KQJ',scoreForCurrentUser1 );
		
		
				// scoreForCurrentUser1 = scoreHandsNormal(['AS','KH','QS']);
		
				// console.log(' sq CASE AKQ',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['AS','2H','3S']);
		
				// console.log('sq CASE A23',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['KS','QH','JS']);
		
				// console.log('sq CASE KQJ',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['AS','KS','JS']);
		
				// console.log('color CASE AKJ',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['AS','KS','TS']);
		
				// console.log('COLOR CASE AK10',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['AS','AC','KS']);
		
				// console.log('pair  CASE AAK',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['AS','AC','QS']);
		
				// console.log('pair  CASE AAQ',scoreForCurrentUser1 );
		
				// scoreForCurrentUser1 = scoreHandsNormal(['2S','2C','3S']);
		
				// console.log('pair last CASE 223',scoreForCurrentUser1 );
			
		
		
		
		
		
		
		
				// [ '7s', 'Tc', 'As' ]
				//['Ah', 'Ac', 'As'] =  5540101
				// Pure sequ - 1 - 4291312
				// last in pure sq - 4190302
				// last in high card - 50302
				// Sequance - { name: 'Sequence', desc: 'Sequence of A High', score: 3441312 }
				//  Last Sequance - { name: 'Sequence', desc: 'Sequence of 4 High', score: 3340302 }
				 // 1st in colors - { name: 'Color', desc: 'Color of A High', score: 2441311.0000000005 }
				 //last in colors - { name: 'Color', desc: 'Color of 5 High', score: 2500301.9999999995 }
				 //1st in pair - { name: 'Pair', desc: 'Pair of A', score: 1591300 }
				// Last in pair - { name: 'Pair', desc: 'Pair of 2', score: 1470300 }
				 //1st in highcard - { name: 'Pair', desc: 'Pair of 2', score: 1470300 }
			
				player.cardType = scoreForCurrentUser.name;
				player.cardScore = scoreForCurrentUser.score;
				player.roomid.markModified('alreadyAssignedCards');
				await player.roomid.save();
				await PlayingData.updateOne({_id: player.id},{$set: {
					cardType : player.cardType,
					cardScore : player.cardScore,
					cardseen : player.cardseen,
					cards : player.cards

				}});
				//await player.save();
				
				// Set chaal Value
				response.cards = carDr;
				response.cardName = player.cardType;
		
				} else {
		
					response.cards = player.cards;
					response.cardName = player.cardType;
		
				}
		}
		
		
		response.status = 1;
		response.message = '.js'; 
		if(callback){
			io.in(player.roomid.id).emit('teenpatti_otherplayercardstatus',JSON.stringify({watching: player.watching, playStatus: 'Play', cardStatus : player.cardseen, seat: player.seat  }));
			return callback(JSON.stringify(response));	
		} else {
			return player;
		}

	} catch (err) {

		logger.error(err.message, {metadata: err});
		response.message = err.message || err.toString();
		return callback(JSON.stringify(response));
	}
		
	}

const callChaal = async (requestedData,socket, io ,callback) => {

let response = {
			status : 0,
			cards : [], 
			message: 'Issue in chaal'
		}

		
		// Total balance after deduct
		// Total bet value for every player
		// Total potvalue boradcast

		try {
			if(!requestedData) {
				response.message = 'Please provide all information.'
				return callback(response);
			}
	  
			let req = JSON.parse(requestedData);
		
			if(req.betValue == undefined) {
				response.message = 'Please provide bet value..js';
				return callback(JSON.stringify(response));
			  }
			
			if(req.rising == undefined) {
				response.message = 'Please provide rising value..js';
				return callback(JSON.stringify(response));
			  }  

			
			let playDataWithUser = await PlayingData.findOne({socketid:socket.id}).populate(['roomid','userid']);
	
			req.betValue = parseFloat(req.betValue);
			
			if(isNaN(req.betValue)){
					response.message = 'Please provide bet value in numeric..js';
					return callback(JSON.stringify(response));
			}
			

			  if(playDataWithUser) {
			
				// if(playDataWithUser.userid.loginAgain) {
				// 	await removePlayerFromRoom(socket,io,1);
				// }
				
				if( (parseFloat(playDataWithUser.chaalValue) - req.betValue)  >  1) {
					response.message = 'Please provide right betvalue..js';
					return callback(JSON.stringify(response));
			  }

			  if(req.betValue > playDataWithUser.roomid.chaalLimit ) {
				req.betValue = playDataWithUser.roomid.chaalLimit;
			  }
			  
			   let responseBetting = await teenPattiWalletAndBetting(playDataWithUser,req.betValue,io);
			
			   
			  if(responseBetting.status) {
				
				playDataWithUser.chaalValue = req.betValue;
				playDataWithUser.roundCount += 1;
				playDataWithUser.rising = req.rising;
			
				if( playDataWithUser.userid.coins < 10000 && playDataWithUser.userid.boat ) {
					playDataWithUser.userid.coins = playDataWithUser.userid.coins + 100000; 
				}

				await playDataWithUser.save();

				response.message = '.js';
				response.status = 1;
				response.coins = playDataWithUser.userid.coins;
				response.sumChaalValue = playDataWithUser.sumChaalValue;
				response.potValue = playDataWithUser.roomid.potValue;
				response.seat = playDataWithUser.seat;
				response.roundCount = playDataWithUser.roundCount;
				response.chaalValue = req.betValue;
				response.rising = playDataWithUser.rising;

				let otherCallChaal = {
					sumChaalValue : playDataWithUser.sumChaalValue,
					potValue : playDataWithUser.roomid.potValue,
					seat : playDataWithUser.seat,
					chaalValue : req.betValue,
					roundCount : playDataWithUser.roundCount,
					rising: playDataWithUser.rising
				};
				
				//responseBetting.room.potValue += req.betValue;
				io.in(playDataWithUser.roomid.id).emit('teenpatti_otherplayercardstatus',JSON.stringify({watching: playDataWithUser.watching, cardStatus : playDataWithUser.cardseen , seat: playDataWithUser.seat, playStatus: 'Play' }));
			io.in(playDataWithUser.roomid.id).emit("teenpatti_other_callchaal", JSON.stringify(otherCallChaal));
		
			if(req.show !== undefined && req.show) {

				let playingData = await PlayingData.find({roomid: playDataWithUser.roomid.id, watching:false, packed: false, waiting:false});

				if( playingData.length > 2 ) {
					await sideshow(socket,io,(res) => {
						response.sideshow = res;
					});
				} else {
					await show(socket,io,(res) => {
						response.show = res;
					});
				}
				
				
			  } else {
				await startTimerOnNextTurn(playDataWithUser.roomid,io);
			  }
		} else {
			response.message = 'Issue in call chaal..js';
			logger.error(response.message, {metadata: responseBetting});
			return callback(JSON.stringify(response));
		}
		

			
	
			if(response.potValue >= playDataWithUser.roomid.potLimit) {
				
				response.limitPotReached = 1; 
	
				io.in(playDataWithUser.roomid.id).emit("teenpatti_potlimit", JSON.stringify({
					'potlimit' : response.potValue,
					'roomid' : playDataWithUser.roomid.id
				}));

				show(socket,io,(res) => {});
			}
		}

			 
			return callback(JSON.stringify(response));

		} catch (err) {
			
			logger.error(err.message, {metadata: err});
			response.message = err.message || err.toString();
			return callback(JSON.stringify(response));
			
		}
		
		// Response
	}

const callPack = async (socket, io ,callback) => {	
		
		let response = {
			status : 0,
			message: 'Issue in call pack request'

		};

		try {
		
			let playDataWithUser = await PlayingData.findOne({socketid:socket.id}).populate(['roomid','userid']);
	
			if( playDataWithUser.packed ) {
			
				response.message = 'Already Packed'
			
			} else {
			
				response = await playerPacked(playDataWithUser, io);
				//await startTimerOnNextTurn(playDataWithUser.roomid,io);
			}

			return callback(JSON.stringify(response));

		} catch(err) {

			logger.error(err.message, {metadata: err});
			response.message = err.message || err.toString();
			return callback(JSON.stringify(response));

		}
	}

const sideshow = async (socket, io ,callback) => {	
		
		let response = {
			status : 0,
			message: 'Issue in side show request'
		}

		try {

			let playDataWithUser = await PlayingData.findOne({socketid:socket.id, packed:false, watching:false, waiting:false }).populate('roomid');

			if(playDataWithUser.roomid.potValue >= playDataWithUser.roomid.potLimit ) {
				response.message = 'Pot limit has been reached.'
				return callback(JSON.stringify(response));
			  }

			if(playDataWithUser) {
			
			let checkingForSideShowUsers = await PlayingData.find({ packed:false, watching:false, waiting:false, roomid:playDataWithUser.roomid}).sort({seat: 1}).populate('userid');
		
			if(checkingForSideShowUsers.length >= 2) {
				
				let checkingUser = [], allRoomUsers = {};

				for (const singleUser of checkingForSideShowUsers) {
					checkingUser.push(parseInt(singleUser.seat));
					allRoomUsers[singleUser.seat] = singleUser;
				}

				// Check index
				let userIndex =  checkingUser.indexOf(playDataWithUser.seat);

				if( userIndex == 0 ) {
					userIndex = ( checkingUser.length - 1 );
				} else {
					userIndex = userIndex - 1;
				}

				playDataWithUser.sideshowAsked = allRoomUsers[checkingUser[userIndex]].seat;
				
				
				let updatePlayData = await PlayingData.updateOne({ userid : ObjectId(allRoomUsers[checkingUser[userIndex]].userid.id) , roomid:playDataWithUser.roomid},{$set : { sideshowAskedBy :playDataWithUser.seat }});
                

				playDataWithUser.roomid.currentTurn = allRoomUsers[checkingUser[userIndex]].seat;


				let turnTime = new Date();
				let curTime = new Date();

				turnTime.setSeconds(turnTime.getSeconds() + bettingTime);

				let diff = Math.floor((turnTime.getTime() - curTime.getTime()) / 1000 );
	 
				playDataWithUser.roomid.turnTimerEnd = turnTime.toISOString();
				
				await playDataWithUser.roomid.save();
				await playDataWithUser.save();

				io.in(playDataWithUser.roomid.id).emit("teenpatti_playertimer",JSON.stringify({
					seats : playDataWithUser.roomid.currentTurn,
					counter:diff,
					sideshowResponse: 1, 
				}));

				

				response.asked_seat = allRoomUsers[checkingUser[userIndex]].seat;
				response.asked_image = allRoomUsers[checkingUser[userIndex]].userid.image;
				response.asked_user = allRoomUsers[checkingUser[userIndex]].userid.username;
				response.askedby_user = allRoomUsers[playDataWithUser.seat].userid.username;
				response.askedby_image = allRoomUsers[playDataWithUser.seat].userid.image;
				response.askedby_seat = playDataWithUser.seat,
				response.status = 1;
				response.message = '.js';

				io.to(playDataWithUser.roomid.id).emit('teenpatti_askingsideshow',JSON.stringify(response));
			
			} else {
				response.message = 'SideShow is not allowed with last two players.'
			}
		}

		return callback(JSON.stringify(response));
		
		} catch(err) {
			
			logger.error(err.message, {metadata: err});
			response.message = err.message || err.toString();
			return callback(JSON.stringify(response));
			
		}	  
	}

const sideShowStatus = async (requestedData, socket, io ,callback) => {	

		let response = {
			status : 0,
			message: 'Issue in accept side show'
		}
		
		try {

			if(!requestedData) {
				response.message = 'Please provide all information.'
				return callback(response);
			}
	  
			let req = JSON.parse(requestedData);

			if(req.status == undefined) {
				response.message = 'Please provide status for side show..js';
				return callback(JSON.stringify(response));
			}

			if(req.otherplayerseat == undefined) {
				response.message = 'Please provide the other player seatid..js';
				return callback(JSON.stringify(response));
			}

			let currentUser = await PlayingData.findOne({socketid:socket.id,  packed:false, watching:false, waiting:false }).populate(['roomid','userid']);


			if( currentUser ) {

			if( req.status == 1) {
				
					let secondUser = await PlayingData.findOne({roomid:currentUser.roomid.id, seat :req.otherplayerseat}).populate('userid');
					
					let alreadyAssignedCard = currentUser.roomid.alreadyAssignedCards;				
					
					if(!currentUser.cardseen) {

						currentUser = await cardSeen({id:currentUser.socketid},io,'');
	
						// Card seen logic one time
						// let cards = cardDraw(alreadyAssignedCard);
						// alreadyAssignedCard.push(cards[0],cards[1],cards[2]);
						// currentUser.cards = cards;
					}
	
					if(!secondUser.cardseen) {

						secondUser = await cardSeen({id:secondUser.socketid},io,'');
	
						// let cards = cardDraw(alreadyAssignedCard);
						// alreadyAssignedCard.push(cards[0],cards[1],cards[2]);
						// secondUser.cards = cards;
					}
	
					let scoreForCurrentUser = scoreHandsNormal([currentUser.cards[0].toString(), currentUser.cards[1].toString(), currentUser.cards[2].toString()]);
					currentUser.cardType  = scoreForCurrentUser.name;
					currentUser.cardScore = scoreForCurrentUser.score; 	

					let scoreForOtherUser = scoreHandsNormal([secondUser.cards[0].toString(), secondUser.cards[1].toString(), secondUser.cards[2].toString()]);
					secondUser.cardType = scoreForOtherUser.name;
					secondUser.cardScore = scoreForOtherUser.score;
					
					if(scoreForCurrentUser.score < scoreForOtherUser.score ) {
						// Other user winner
						currentUser.packed = true;
						currentUser.watching = true;
						response.packedUser = currentUser.userid.username;
						response.packedSeat = currentUser.seat;
						response.winsideshowSeat = secondUser.seat;
						response.winsideshowUser = secondUser.userid.username;
						
						
					} else {
						// Current user winner
						secondUser.packed = true;
						secondUser.watching = true;
						response.packedUser = secondUser.userid.username;
						response.packedSeat = secondUser.seat;
						response.winsideshow = currentUser.seat;
						response.winsideshowUser = currentUser.userid.username;
					}

					response.asked_seat = currentUser.seat;
					response.askedby_seat = secondUser.seat;

					currentUser.cardseen = true;
					secondUser.cardseen = true;
					await currentUser.save(); 
					await secondUser.save();
					

					
					response.status = 1;
					response.message = '.js';
					response.sideshow = 1;
					
					let responseCards = {};

					responseCards[currentUser.seat] = {};
					responseCards[currentUser.seat]['cards'] = currentUser.cards;
					responseCards[currentUser.seat]['cardName'] = currentUser.cardType;

					responseCards[secondUser.seat] = {};
					responseCards[secondUser.seat]['cards'] = secondUser.cards;
					responseCards[secondUser.seat]['cardName'] = secondUser.cardType;
					
					// To current user
					io.to(currentUser.socketid).emit('teenpatti_sideshowresult_cards',JSON.stringify(responseCards));
					
					// To other user
					io.to(secondUser.socketid).emit('teenpatti_sideshowresult_cards',JSON.stringify(responseCards));
				
					io.to(currentUser.roomid.id).emit('teenpatti_sideshowresult',JSON.stringify(response));
								
			} else {

				response.status = 1;
				response.message = 'Sideshow rejected.js';
				response.asked_seat = currentUser.seat;
				response.askedby_seat = req.otherplayerseat;
				response.sideshow = 0;

				io.to(currentUser.roomid.id).emit('teenpatti_sideshowresult',JSON.stringify(response));
			}

			await startTimerOnNextTurn(currentUser.roomid,io);
		} else {
			response.message = 'SideShow is not allowed with last two players.'
		}

			return callback(JSON.stringify(response));
		} catch(err) {
			logger.error(err.message, {metadata: err});
			response.message = err.message || err.toString();
			return callback(JSON.stringify(response));
			
		}
	}

	// socket.on("RemovePlayer", function () {
	// 	// Code here for remove players
	// 	socket.leave(PLAYER_LIST[socket.id].roomid); 
	
	// });

const show = async ( socket, io ,callback) => {

		// Fetch all non watching users.
		// check if card is already seen for both
		// check if potlimit reached
		// Calculated score and declare result 
		// Put the transaction into transaction table
		// Reset the Game

		let response = {
			status : 0,
			message: 'Issue in accept side show',
			data : {}
		}
		
		try {

			// let socketId = isObject(socket) ? socket.id : socket; 
			let currentUser = await PlayingData.findOne({socketid:socketId}).populate('roomid');

			let maxscoreObject = {
				score : 0,
				clientid : 0,
				seat:0,
			}; 

			if(currentUser) {
				 
				if(!currentUser.roomid || currentUser.roomid.resetGameTime) {
					return;
				}
				await Room.updateOne({_id: ObjectId(currentUser.roomid.id) },{ $set : { stopTimer : true}});
				
				let allLiveUsers = await PlayingData.find({roomid:currentUser.roomid, watching : false, packed : false, waiting : false}).populate('userid');
				let alreadyAssignedCard = currentUser.roomid.alreadyAssignedCards;

				if(allLiveUsers.length) {
					for (const singleUser in allLiveUsers) {
						if( !allLiveUsers[singleUser].cardseen ) {
							let cards = cardDraw(alreadyAssignedCard);
							alreadyAssignedCard.push(cards[0],cards[1],cards[2]);
							allLiveUsers[singleUser].cardseen = true;
							allLiveUsers[singleUser].cards = cards;
						}


						let handNormal1 = scoreHandsNormal([allLiveUsers[singleUser].cards[0].toString(), allLiveUsers[singleUser].cards[1].toString(), allLiveUsers[singleUser].cards[2].toString()]);

						allLiveUsers[singleUser].cardType  = handNormal1.name;
						allLiveUsers[singleUser].cardScore  = handNormal1.score;
						

						response['data'][allLiveUsers[singleUser].seat] = {
							'cards' :  allLiveUsers[singleUser].cards,
							'image' : allLiveUsers[singleUser].userid.image,
							'cardsName' : allLiveUsers[singleUser].cardType
						}

						// response.cardsName[allLiveUsers[singleUser].seat] = singleUser.cardType;
						// response.cards[allLiveUsers[singleUser].seat] = allLiveUsers[singleUser].cards;
						// response.image[allLiveUsers[singleUser].seat] = allLiveUsers[singleUser].userid.image;

						await allLiveUsers[singleUser].save();
						
						if( maxscoreObject.score < handNormal1.score ) {
							maxscoreObject.score = handNormal1.score;
							maxscoreObject.clientid = allLiveUsers[singleUser].userid.id;
							maxscoreObject.seat = allLiveUsers[singleUser].seat;
						}
	
					}
	
					response.winner = {
						user : maxscoreObject.clientid,
						seat : maxscoreObject.seat
					};
					
					response.status = 1;
					response.message = '.js';
					
					let transactionResponse = await transactionForTeenPatti(currentUser.roomid,maxscoreObject.clientid,maxscoreObject.seat,io);
					//resetGameTime

					io.in(currentUser.socketid).emit('teenpatti_playercoins',JSON.stringify(
						{
						coins: transactionResponse.coins
					   }
					   ));
					response.winamount = transactionResponse.winning;
					
					// response.automatic = isObject(socket) ? 0 : 1
					//await resetRoomGame(currentUser.roomid, io);
	
					io.in(currentUser.roomid.id).emit('teenpatti_showresult',JSON.stringify(response));

		// 			let playingData = await PlayingData.find({roomid:currentUser.roomid.id, packed: false, watching: false, waiting: false});
		// 			let gameStartTimerAr = [];
		// 			for (const singlePlayer of playingData) {
            
        //     		gameStartTimerAr.push({
        //       			seat : singlePlayer.seat,
        //       			username: singlePlayer.userid.username,
        //       			playStatus: singlePlayer.watching ? (singlePlayer.waiting ? 'Watching' : 'Packed') : 'Play',
        //       			cardStatus : singlePlayer.cardseen ? 'Seen' : 'Blind',
        //       			photo: singlePlayer.userid.image,
        //       			watching:  singlePlayer.watching
        //     	});
        //   }
		//   			io.in(currentUser.roomid.id).emit('teenpatti_player_status',JSON.stringify(gameStartTimerAr));   
				}
				
			} else {
				response.message = 'Not found current user in it.'
			}

			return callback(JSON.stringify(response));
		} catch(err) {
			logger.error(err.message, {metadata: err});
			response.message = err.message || err.toString();
			return callback(JSON.stringify(response));
			}
	}

const playerDisconnect = async(socket, io ,callback) => {
	
	let response = {
		status: 0,
		message: 'Issue in player connect' 
	}

	try {
		
		await removePlayerFromRoom(socket,io);
		response.status = 1;
		response.message = 'Player disconnected from game.js';

		return callback(JSON.stringify(response));

	} catch(err) {
		logger.error(err.message, {metadata: err});
      	response.message = err.message || err.toString();
      	return callback(JSON.stringify(response));
	}
	
}

const refundAndRemoveCurrentRoom = async () => {

	try {
		let currentRunningRoom = await Room.find({});

		let userBets = {};

    	if(currentRunningRoom.length) {
      		for (const singleRoom in currentRunningRoom) {
    
		if(currentRunningRoom[singleRoom].play) {
			
			// Total of game his

			let bettings = await Betting.find({
				'game_history': currentRunningRoom[singleRoom].currentgamehistory,
				status: 'completed'
			  }).exec();
		
			  
			  // Start loop on bettings
			  for (let singleBet of bettings) {
				if (userBets[singleBet.user] === undefined) {
				  userBets[singleBet.user] = {};
				  userBets[singleBet.user]['betamount'] = 0;
				  
				}
				userBets[singleBet.user]['betamount'] += singleBet.amount;
			  }
		}
		await PlayingData.deleteMany({roomid : currentRunningRoom[singleRoom].id });
		await Room.deleteOne({_id : currentRunningRoom[singleRoom].id });
		await User.updateMany({boat:true},{$set : {alreadyConnected: false }});
	  }

	  let users = await User.find({_id: {$in: Object.keys(userBets) }});
	  
	  // Daily value
	  let day = new Date();
	  
	  for (const user in users) {
	
    	if (users[user].play_point_update == day.getDay()) {
        	users[user].daily_play_points -= userBets[users[user].id]['betamount'];
		} else {
			users[user].daily_play_points = userBets[users[user].id]['betamount'];
		}

		if(users[user].daily_play_points < 0) {
			users[user].daily_play_points = 0;
		}


	users[user].coins -= userBets[users[user].id]['betamount'];
    await users[user].save();
	 
	}
	}
	} catch (err) {
			logger.error(err.message, {metadata: err});
	}
}	


const resetRoomGame = async (room, io) => {

	try {
		
	room.potValue = 0;
    room.play = 0;
	room.alreadyAssignedCards = [];

	let users = await User.find({_id: {$in : room.users}, boat: false});
	// room.users

	if(users.length == 0) {
		
		// Can apply promise all
		await User.updateMany({_id: {$in : room.users}, boat: true},{$set : { alreadyConnected : false }});
		await PlayingData.deleteMany({roomid : room.id });
		await Room.deleteOne({_id : room.id });

		return 1;
	}

	let updateRoom = 1;
	if(room.users.length > 1 ) {

/*
		let currentTime =  new Date();
			currentTime.setSeconds(currentTime.getSeconds() + 5);
			room.playtime = currentTime.toISOString();
		
			let endTime = new Date();
		
			endTime.setMinutes(endTime.getMinutes() + 10);
		
			// Create game
			let gameHistory = await GameHistory.create({
				start: currentTime.toISOString(),
				end: endTime.toISOString(),
				total_betting: 0,
				total_winning: 0,
				game: gameId,
				jackpot: 0,
			  });
		
			  if(gameHistory) {
				room.currentgamehistory = gameHistory.id;
			  }
*/

		 if((5 - room.users.length)) {
		 	updateRoom = 0;
		 	 
		// 	// Call function
		 	// let a = await teenPattiActiveBoats(room,io);
			 
		 } else {
			let currentTime =  new Date();
			currentTime.setSeconds(currentTime.getSeconds() + 5);
			room.playtime = currentTime.toISOString();
		
			let endTime = new Date();
		
			endTime.setMinutes(endTime.getMinutes() + 10);
		
			// Create game
			let gameHistory = await GameHistory.create({
				start: currentTime.toISOString(),
				end: endTime.toISOString(),
				total_betting: 0,
				total_winning: 0,
				game: gameId,
				jackpot: 0,
			  });
		
			  if(gameHistory) {
				room.currentgamehistory = gameHistory.id;
			  }
		}
		  
	}

	//room.stopTimer = false;
	//	await room.save();

	if( updateRoom )  {
		room.stopTimer = false;
		await room.save();	
	}
	

	let playingData = await PlayingData.find({roomid:ObjectId(room.id)}).populate('userid');

	for (let singlePlayer of playingData) {
		
		singlePlayer.cardseen = false;
		singlePlayer.cardsType = '.js';
		singlePlayer.cardScore = 0;
		singlePlayer.cards =  [];
		singlePlayer.watching =  false;
		singlePlayer.waiting =  false;
		singlePlayer.packed =  false;
		singlePlayer.sumChaalValue =  0;
		singlePlayer.roundCount =  0;
		singlePlayer.chaalValue= room.bootValue;
		

		await singlePlayer.save();
	}
	console.log('reset process almost done');

	io.in(room.id).emit('teenpatti_game_reset',JSON.stringify({status: 1, message: 'Game has been reset' }));

	return 1;

} catch (error) {
	console.log(error);		
}

}	

const transactionForTeenPatti = async (room,winner,winningSeat,io) => {

	let adminCommision = await settingsData('teempatti_admincommision');
	let winners = [];
	let response = {
		winning : 0,
	}

	let totalBetAmount = 0;

	let bettings = await Betting.find({
        'game_history': room.currentgamehistory,
        status: 'completed'
      }).exec();

	  let userBets = {};

      
	  // Start loop on bettings
      for (let singleBet of bettings) {
        if (userBets[singleBet.user] === undefined) {
          userBets[singleBet.user] = {};
          userBets[singleBet.user]['betamount'] = 0;
          userBets[singleBet.user]['winamount'] = 0;
          userBets[singleBet.user]['user'] = String(singleBet.user);
          userBets[singleBet.user]['game_history'] = String(singleBet.game_history);
          userBets[singleBet.user]['game'] = String(singleBet.game);
          userBets[singleBet.user]['ticket_id'] = singleBet.ticket_id;
        }

        userBets[singleBet.user]['betamount'] += singleBet.amount;
  
      }

	  // Todo if without bet shows happens
	//  if(userBets[winner].winamount == undefined) {

	//  }
	if(userBets[winner] == undefined) {
		userBets[winner] = {};
		userBets[winner].winamount = 0;
	} 
	
	
	  // Set commission for admin
	  if (adminCommision > 0) {

		userBets[winner].winamount = room.potValue * (1 - (adminCommision/100));
	  } else {
		userBets[winner].winamount = room.potValue;
	  }


	response.winning = userBets[winner].winamount;
	let allUserIds = Object.keys(userBets);
	let transactionData = [] ,user;

for await (let userBetKey of allUserIds) {

user = await User.findById(userBetKey,'coins');


if(userBets[userBetKey] != undefined && userBets[userBetKey]['betamount'] > 0 && user.boat != true) {
	transactionData.push({
        type: "SUBTRACT",
        fromUser: userBetKey,
        game_history_id: userBets[userBetKey]['game_history'],
        game_id: userBets[userBetKey]['game'],
        trans_coins: userBets[userBetKey]['betamount'],
        comment: 'Subtract for playing teenpatti',
        remaining_coins: user.coins
    });

	if(user.boat != true) {
		totalBetAmount += userBets[userBetKey]['betamount'];
	}
}

}

	// Set winner
	winners.push(winner);

	

	if(userBets[winner]['winamount'] != undefined && userBets[winner]['winamount'] > 0) {
		// Get winner user details 
	user = await User.findById(winner).exec();

		// Daily value
		let day = new Date();
	
		if (user.play_point_update == day.getDay()) {
			  
		  user.daily_winning_points += userBets[winner]['winamount']; 
	 
		} else {
		  user.daily_winning_points = userBets[winner]['winamount'];
		}

		user.winning = user.winning +  userBets[winner]['winamount'];
	
		user.coins += userBets[winner]['winamount'];
		await user.save();

		if(user.boat == true) {
			userBets[winner]['winamount'] = 0;	
		}
		
		response.coins = user.coins;
      if(user.boat != true)	{
		transactionData.push({
			type: "ADD",
			toUser: winner,
			game_history_id: userBets[winner]['game_history'],
			game_id: userBets[winner]['game'],
			trans_coins: userBets[winner]['winamount'],
			comment: 'Add for winning in teenpatti',
			remaining_coins: user.coins
		});
	  }  
	}
    
  if(transactionData.length) {
	await Transaction.insertMany(transactionData);
  }

	

	// Update winner and total winning amount in game history
	let gameHisUpdate = await GameHistory.updateOne({
        _id: room.currentgamehistory
      }, {
        winners: winners,
		total_betting:totalBetAmount, 
        total_winning: userBets[winner]['winamount']
      });
      
	  let curntTime = new Date();
	  curntTime.setSeconds(curntTime.getSeconds() + 10);
	  room.resetGameTime = curntTime.toISOString();
	  room.lastWinner = winningSeat;
	  await room.save()

	  await Betting.deleteMany({
        game_history : room.currentgamehistory,
        byBoat : true
      });  

	  return response;
}
	
// Card function
const cardDraw = (alreadyDarwn) => {

	let min = 0;
	let max = 51;
	let selectedNumbers = [],counter = 3;

	while(counter) {
		let selectedNo = Math.floor(Math.random() * (max - min + 1)) + min;
		
		if(!alreadyDarwn.includes(totalCards[selectedNo])) {
			counter--;
			
			selectedNumbers.push(totalCards[selectedNo]);
			alreadyDarwn.push(totalCards[selectedNo]);
			continue;

		}
	}

	return selectedNumbers;
}

const removePlayerFromRoom = async (socket,io,logoutCase = 0) => {

	let playingDataWithRoom = await PlayingData.findOne({ socketid : socket.id}).populate(['roomid','userid']);

	if(playingDataWithRoom) {

		let seat = '.js';

		for(let singleSeat of Object.keys(playingDataWithRoom.roomid.seatings)) {
			
			if(playingDataWithRoom.roomid.seatings[singleSeat] == playingDataWithRoom.userid.username) {
				playingDataWithRoom.roomid.seatings[singleSeat] = '.js';
				seat = singleSeat;
			}
		}
	
		let userPostion = playingDataWithRoom.roomid.users.indexOf(playingDataWithRoom.userid.id);
			if ( userPostion > -1 ) { // only splice array when item is found
				playingDataWithRoom.roomid.users.splice(userPostion, 1); // 2nd parameter means remove one item only
			}
	
			playingDataWithRoom.roomid.markModified('seatings');
			await playingDataWithRoom.roomid.save();	
		//await Room.updateOne({_id: playingDataWithRoom.roomid.id},{$set:playingDataWithRoom.roomid});
		// playingDataWithRoom.roomid
		io.in(playingDataWithRoom.roomid.id).emit("teenpatti_otherplayer_disconnect", JSON.stringify({
			seat : seat,
			username: playingDataWithRoom.userid.username,
			sumChaalValue: playingDataWithRoom.sumChaalValue
		}));

		if(logoutCase) {
			io.in(playingDataWithRoom.roomid.id).emit("teenpatti_logout_from_running_game", JSON.stringify({
				seat : seat,
				username: playingDataWithRoom.userid.username,
				sumChaalValue: playingDataWithRoom.sumChaalValue
			}));
		}

		if(playingDataWithRoom.seat == playingDataWithRoom.roomid.currentTurn) {
			await startTimerOnNextTurn(playingDataWithRoom.roomid,io);
		}
		if( !playingDataWithRoom.userid.boat ) {
			socket.leave(playingDataWithRoom.roomid.id);
		} else {
			playingDataWithRoom.userid.alreadyConnected = false;
			await playingDataWithRoom.userid.save();
		}
		
		await PlayingData.deleteMany({ socketid : socket.id});
		await checkForShow(playingDataWithRoom.roomid.id,socket,io);
	
	}
	
	return {
		status : 1,
	};
}

const checkForShow = async (roomid,socket,io) => {
	
	let playersInRoom = await PlayingData.find({roomid:ObjectId(roomid),packed: false, watching: false, waiting: false});
	
	let res = 0;

	if(playersInRoom.length == 1 ) {

		res = await show(playersInRoom[0].socketid,io,(response) => {
			return  1;
	   });
		
	} else if(playersInRoom.length == 0) {
		// Reset game
		let rm =  await Room.findById(roomid);
		await resetRoomGame(rm,io);
		return  1;
	}
	return res; 
} 
 
const selectPlayerTurns = async ( room ) => {

	try {
		
	
	let res = {};

	let playingData = await PlayingData.find({roomid:ObjectId(room.id), watching: false, waiting: false, packed: false }, 'seat');

	if(playingData.length > 1) {
	let alllPlayers = {};
	let playingPlayers = [];
	for (const singlePlayerSeat of playingData) {
		alllPlayers[singlePlayerSeat.seat] = singlePlayerSeat;
		playingPlayers.push(singlePlayerSeat.seat);
	}

	let seat = parseInt(room.currentTurn);
	
	let increment = 1;
	let sideshowAskedBy = 0;

	//&& alllPlayers[seat].sideshowAskedBy

	let firstPlayerData = await PlayingData.findOne({roomid:ObjectId(room.id), seat:seat  });

	if(firstPlayerData && firstPlayerData.sideshowAskedBy > 0) {
		let secondPlayer = await PlayingData.findOne({roomid:ObjectId(room.id), seat: firstPlayerData.sideshowAskedBy });

		sideshowAskedBy = firstPlayerData.sideshowAskedBy;

		firstPlayerData.sideshowAskedBy = 0;
		firstPlayerData.sideshowAsked = 0;
		firstPlayerData.save();
		secondPlayer.sideshowAsked = 0;
		secondPlayer.sideshowAskedBy = 0;
		secondPlayer.save();

		increment = 2;
	}

	let currentSeat = seat + 1;

	if(sideshowAskedBy) {
		currentSeat = sideshowAskedBy + 1;
		seat = sideshowAskedBy;
	}

	if( currentSeat > 5 ) {
		currentSeat = 1;
	}
	
	while(playingPlayers.indexOf(currentSeat) == -1) {
		currentSeat++;
		
		if( currentSeat > 5 ) {
			currentSeat = 1;
		}	
	}
	res['newSeatAssignment'] = currentSeat;
	
	seat = currentSeat - 1;

	if( seat < 1 ) {
		seat = 5;
	}	

	while(playingPlayers.indexOf(seat) == -1) {
		seat--;
		
		if( seat < 1 ) {
			seat = 5;
		}	
	}

	res['previousSeatAssignment'] = seat;

	}

	res['totalPlayingUser'] = playingData.length;
	return res;
} catch (err) {
	logger.error(err.message, {metadata: err});
	console.log(err);	
	}

} 

const playerPacked = async (playDataWithUser, io) => {
				
				let response = {}
				playDataWithUser.packed = true;
				playDataWithUser.watching = true;
				await playDataWithUser.save();
				response.seat = playDataWithUser.seat;
				response.status = 1;
				response.message  = '.js';
				
				
				io.in(playDataWithUser.roomid.id).emit('teenpatti_otherplayercardstatus',JSON.stringify({watching: playDataWithUser.watching, playStatus : 'Packed', cardStatus:playDataWithUser.cardseen, seat: playDataWithUser.seat }));

				let res = await checkForShow(playDataWithUser.roomid.id, playDataWithUser.socketid, io);

				if( res == 0 ) {
					await startTimerOnNextTurn(playDataWithUser.roomid,io);
				  
				  }

				return response;
}

const dealerTip = async (requestedData, socket, io, callback) => {
	
	
	let response = {
		status : 0,
		message: 'Issue in tip request'
	}

	try {

	let req = JSON.parse(requestedData);
	
	
	if(req.amount == undefined) {
		response.message = 'Please provide amount value..js';
		return callback(JSON.stringify(response));
	  }

	if(req.amount <= 0) {
		response.message = 'Please provide amount need to greate from 0..js';
		return callback(JSON.stringify(response));
	  }  

	
	let playDataWithUser = await PlayingData.findOne({socketid:socket.id}).populate('userid','coins lockedmoney').populate('roomid');
	
	
	if(playDataWithUser.userid.coins < req.amount) {
		response.message = 'You do not have this much balance.js';
		return callback(JSON.stringify(response));
	}

	playDataWithUser.userid.coins = playDataWithUser.userid.coins - req.amount;
	playDataWithUser.userid.lockedmoney = playDataWithUser.userid.lockedmoney - req.amount;  

	if(playDataWithUser.userid.lockedmoney < 0) {
		playDataWithUser.userid.lockedmoney = 0; 
	}
	
	// Get admin details
	let fromUser = await User.findById('61160d8e90f4c31eb5433773').exec();

	let transactions = [];

	let trans_coins = req.amount;

	transactions.push({
	  type: "SUBTRACT",
	  toUser: fromUser.id,
	  fromUser: playDataWithUser.userid.id,
	  trans_coins: trans_coins,
	  comment: 'dealertip',
	  remaining_coins: playDataWithUser.userid.coins
  });

if(transactions.length) {
	  await Transaction.insertMany(transactions);
	}
	
	await playDataWithUser.userid.save();
	response.coins = playDataWithUser.userid.coins;
	response.status = 1;
	response.message  = 'Tip has been created into dealer account.js';

	io.in(playDataWithUser.roomid.id).emit('teenpatti_otherdealertip', JSON.stringify({totaltip:1000, amount: req.amount, seat: playDataWithUser.seat }));
	
	return callback(JSON.stringify(response));

} catch(err) {
	logger.error(err.message, {metadata: err});
	  response.message = err.message || err.toString();
	  return callback(JSON.stringify(response));

}
}



const startTimerOnNextTurn = async(room,io) => {
	
	let turnResponseSelctor = await selectPlayerTurns( room );

	if(turnResponseSelctor['totalPlayingUser'] > -1) {

	if( turnResponseSelctor['newSeatAssignment'] == turnResponseSelctor['previousSeatAssignment']) {
		logger.error('Checking on seat assignment previousSeatAssignment '  +  turnResponseSelctor['previousSeatAssignment'] 
		+ ' newSeatAssignment ' + turnResponseSelctor['newSeatAssignment'], { metadata: turnResponseSelctor });
		 await checkForShow(room.id, '', io);
	} else {
		room.currentTurn = turnResponseSelctor['newSeatAssignment'];
	
	 let previousPlayer = await PlayingData.findOne({seat:turnResponseSelctor['previousSeatAssignment'], roomid : ObjectId(room.id)});

	 let nextPlayer = await PlayingData.findOne({seat:turnResponseSelctor['newSeatAssignment'], roomid : ObjectId(room.id)}).populate('userid');
	 
	 if(nextPlayer.cardseen) {
		// Seen case
		if(previousPlayer.cardseen) {
			nextPlayer.chaalValue = previousPlayer.chaalValue;
		} else {
			nextPlayer.chaalValue = previousPlayer.chaalValue * 2;
		}

	 } else {
		// Blind case
		if(previousPlayer.cardseen) {
			let halfValueofSeen = previousPlayer.chaalValue / 2;
			
			if(halfValueofSeen < room.bootValue) {
				halfValueofSeen = room.bootValue;
			}
			nextPlayer.chaalValue = halfValueofSeen;
		} else {
			nextPlayer.chaalValue = previousPlayer.chaalValue;
		}
	}

	nextPlayer.chaalValue = parseFloat(nextPlayer.chaalValue);

	if( nextPlayer.chaalValue > room.chaalLimit ) {
		nextPlayer.chaalValue = room.chaalLimit;
	}
	
	if(nextPlayer.userid.boat) {
		nextPlayer.playCounter = (Math.floor(Math.random() * 7) + 2);	
	}

	//  nextPlayer.chaalValue = previousPlayer.chaalValue;
	// if( nextPlayer.cardseen && !previousPlayer.cardseen ) {
	// 	nextPlayer.chaalValue = previousPlayer.chaalValue * 2;
	// } 

	await nextPlayer.save();
				  
	let turnTime = new Date();
	let curTime = new Date();

	turnTime.setSeconds(turnTime.getSeconds() + bettingTime);

	let diff = Math.floor((turnTime.getTime() - curTime.getTime()) / 1000 );
	 
	 room.turnTimerEnd = turnTime.toISOString();
	  

	   await room.save();

	   let currentPlayerData = await PlayingData.findOne({roomid:ObjectId(room.id), seat:room.currentTurn}).populate('userid');

	   if(currentPlayerData) {

		
		io.in(room.id).emit("teenpatti_playertimer",JSON.stringify({
			seats : room.currentTurn,
			counter:diff,
			chaalValue : room.chaalLimit < currentPlayerData.chaalValue ? room.chaalLimit : currentPlayerData.chaalValue ,
            risingValue: room.chaalLimit < ( currentPlayerData.chaalValue * 2 ) ? room.chaalLimit : ( currentPlayerData.chaalValue * 2 ),
			lowbalance :  currentPlayerData.chaalValue > currentPlayerData.userid.coins ? 1 : 0,
			roundCount : currentPlayerData.roundCount ,
			show:  turnResponseSelctor['totalPlayingUser'] > 2 ? 0 : 1
		  }));
	   }
	}
}
   
}



function scoreHandsNormal(playerCards) {
	if (playerCards.length == 3) {
		var clonePlayerCards = _.sortBy(
			_.map(playerCards, function (n) {
				return cards.cardValue(n);
			}),
			"number"
		);
		var handStatus = {};

		var groupByNumber = _.groupBy(clonePlayerCards, "number");
		var groupByColor = _.groupBy(clonePlayerCards, "color");
		var sameNumberCount = _.keys(groupByNumber).length;
		var sameColorCount = _.keys(groupByColor).length;

		var diff1 = clonePlayerCards[1].number - clonePlayerCards[0].number;
		var diff2 = clonePlayerCards[2].number - clonePlayerCards[1].number;
		var isSequence =
			(diff1 == diff2 && diff2 == 1) ||
			(clonePlayerCards[0].number == 1 &&
				clonePlayerCards[1].number == 12 &&
				clonePlayerCards[2].number == 13);

		// High Card
		handStatus.no = 0;
		handStatus.name = "High Card";

		if(clonePlayerCards[1].number == 1) {
			clonePlayerCards[1].number = 14;
		}

		if(clonePlayerCards[2].number == 1) {
			clonePlayerCards[2].number = 14;
		}

		if (clonePlayerCards[0].number == 1) {
			handStatus.card1 = 14;
			handStatus.card2 = clonePlayerCards[2].number;
			handStatus.card3 = clonePlayerCards[1].number;
			handStatus.desc = "High Card of A";
		} else {
			handStatus.card1 = clonePlayerCards[2].number;
			handStatus.card2 = clonePlayerCards[1].number;
			handStatus.card3 = clonePlayerCards[0].number;
			handStatus.desc = "High Card of " + cards.keyToString(handStatus.card1);
		}

		// Pair
		if (sameNumberCount == 2) {
			handStatus.name = "Pair";
			handStatus.no = 1.6;
			// for (var i = 0; i < 3; i++) {
			// 	if (playerCards[i].charAt(1) == "s")
			// 		handStatus.no += 0.2;
			// 	else if (playerCards[i].charAt(1) == "h")
			// 		handStatus.no += 0.15;
			// 	else if (playerCards[i].charAt(1) == "d")
			// 		handStatus.no += 0.1;
			// 	else if (playerCards[i].charAt(1) == "c")
			// 		handStatus.no += 0.05;
			// }
			_.each(groupByNumber, function (n, key) {
				if (n.length == 2) {
					handStatus.card1 = parseInt(key);
					handStatus.desc = "Pair of " + cards.keyToString(key);
					if (key == "1") {
						handStatus.card1 = 14;
					}
				} else {
					handStatus.card2 = parseInt(key);
					if (key == "1") {
						handStatus.card2 = 14;
					}
				}
			});
			handStatus.card3 = 0;
		}

		// Color
		if (sameColorCount == 1) {
			handStatus.no = 2.6;
			// for (var i = 0; i < 3; i++) {
			// 	if (playerCards[i].charAt(1) == "s")
			// 		handStatus.no += 0.2;
			// 	else if (playerCards[i].charAt(1) == "h")
			// 		handStatus.no += 0.15;
			// 	else if (playerCards[i].charAt(1) == "d")
			// 		handStatus.no += 0.1;
			// 	else if (playerCards[i].charAt(1) == "c")
			// 		handStatus.no += 0.05;
			// }
			handStatus.name = "Color";
			handStatus.desc =
				"Color of " + cards.keyToString(handStatus.card1) + " High";
		}

		// Sequence
		if (isSequence) {
			if (
				clonePlayerCards[0].number == 1 &&
				clonePlayerCards[1].number == 2 &&
				clonePlayerCards[2].number == 3
			) {
				handStatus.card1 = 14;
				handStatus.card2 = clonePlayerCards[2].number;
				handStatus.card3 = clonePlayerCards[1].number;
			}

			handStatus.no = 3.6;
			// for (var i = 0; i < 3; i++) {
			// 	if (playerCards[i].charAt(1) == "s")
			// 		handStatus.no += 0.2;
			// 	else if (playerCards[i].charAt(1) == "h")
			// 		handStatus.no += 0.15;
			// 	else if (playerCards[i].charAt(1) == "d")
			// 		handStatus.no += 0.1;
			// 	else if (playerCards[i].charAt(1) == "c")
			// 		handStatus.no += 0.05;
			// }

			handStatus.name = "Sequence";
			handStatus.desc =
				"Sequence of " + cards.keyToString(handStatus.card1) + " High";
		}

		// Pure Sequence
		if (sameColorCount == 1 && isSequence) {
			handStatus.no = 4.2;
			// if (playerCards[0].charAt(1) == "s")
			// 	handStatus.no = 4.2;
			// else if (playerCards[0].charAt(1) == "h")
			// 	handStatus.no = 4.15;
			// else if (playerCards[0].charAt(1) == "d")
			// 	handStatus.no = 4.1;
			// else if (playerCards[0].charAt(1) == "c")
			// 	handStatus.no = 4.05;

			handStatus.name = "Pure Sequence";
			handStatus.desc =
				"Pure Sequence of " + cards.keyToString(handStatus.card1) + " High";


		}

		// Trio
		if (sameNumberCount == 1) {

			handStatus.no = 5.6;
			// for (var i = 0; i < 3; i++) {
			// 	if (playerCards[i].charAt(1) == "s")
			// 		handStatus.no += 0.2;
			// 	else if (playerCards[i].charAt(1) == "h")
			// 		handStatus.no += 0.15;
			// 	else if (playerCards[i].charAt(1) == "d")
			// 		handStatus.no += 0.1;
			// 	else if (playerCards[i].charAt(1) == "c")
			// 		handStatus.no += 0.05;
			// }
			handStatus.name = "Trio";
			handStatus.desc = "Trio of " + cards.keyToString(handStatus.card1);
		}

		handStatus.score =
			handStatus.no * 1000000 +
			handStatus.card1 * 1000 + 
			handStatus.card2 * 100 +
			handStatus.card3 * 10;
		return {
			name: handStatus.name,
			desc: handStatus.desc,
			score: handStatus.score,
		};
	} else {
		console.error(new Error("Number of cards in Score Hands Incorrect"));
	}
}




module.exports = {
	playerConnect,
	cardSeen,
	dealerTip,
	callChaal,
	callPack,
	refundAndRemoveCurrentRoom,
	playerDisconnect,
	sideshow,
	show,
	sideShowStatus,
	playerPacked,
	startTimerOnNextTurn,
	resetRoomGame,
	removePlayerFromRoom
 }