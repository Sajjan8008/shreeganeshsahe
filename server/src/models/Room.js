import mongoose from 'mongoose';

const { Schema } = mongoose;

const RoomSchema = new Schema(
  {
   
    seatings: Object,
    currentTurn: Number,
    potValue: Number,
    users: [],
    currentgamehistory: { type: mongoose.Schema.Types.ObjectId, ref: 'GameHistory' },
    bootid: { type: mongoose.Schema.Types.ObjectId, ref: 'Boot' },
    bootValue : Number,
    chaalValue:Number,
    blindValue: Number,
    maxPlayer:Number,
    shuffle: Number,
    roundCount:Number,
    maxBlind: Number,
    potLimit:Number,
    chaalLimit:Number,
    play:{
		type: Number,
    default:0,
	},
  alreadyAssignedCards: Array,
  completeCardSeen:Boolean,
  playtime:String,
  lastWinner:{
		type: Number,
    default:0,
	},
  turnTimerEnd: Date,
  
  /* Reset game timer */
  resetGameTime:String,
  stopTimer : {
    type: Boolean,
    default: false
  },
  requiredBoat: {
    type: Boolean,
    default: false
  },
  boatTime: {
    type: Date,
    default: null
  }
  }
);



RoomSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    seatings: this.seatings,
    currentTurn:this.currentTurn,
    potValue : this.potValue,
    users: this.users,
    currentgamehistory:this.currentgamehistory,
    bootid : this.bootid,
    bootValue : this.bootValue,
    chaalValue:this.chaalValue,
    blindValue: this.blindValue,
    maxPlayer:this.maxPlayer,
    shuffle: this.shuffle,
    roundCount: this.roundCount,
    maxBlind: this.maxBlind,
    potLimit:this.potLimit,
    chaalLimit:this.chaalLimit,
	  play:this.play,
    alreadyAssignedCards: this.alreadyAssignedCards,
    completeCardSeen : this.completeCardSeen,
    playtime:this.playtime,
    timerEnd:this.timerEnd,
    resetGameTime:this.resetGameTime,
    startNewGame: this.startNewGame,
    stopTimer: this.stopTimer,
    lastWinner: this.lastWinner,
    requiredBoat : this.requiredBoat,
    boatTime : this.boatTime    
  };
};



const Room = mongoose.model('Room', RoomSchema);

export default Room;