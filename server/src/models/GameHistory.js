import mongoose from 'mongoose';

const { Schema } = mongoose;

const GameHistorySchema = new Schema(
  {
    start: {
      type: Date,
      required: [true, "can't be blank"],
      index:true
    },
    end: {
        type: Date,
      },
    
    total_betting: {
      type: Number,
    },
    total_winning: {
      type: Number,
    },

    betting_allow_time: {
      type: Date,
      index : true
  },
    
  winners: {
    type:Array,
    },
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  number: {
    type: String
  },
  jackpot: {
    type: Number,
    default: 0
  },
  },
  { timestamps: true },
);



GameHistorySchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    start: this.start,
    end: this.end,
    total_betting: this.total_betting,
    total_winning: this.total_winning,
    betting_open: this.betting_open,
    winners: this.winners,
    game: this.game,
    betting_allow_time:this.betting_allow_time,
    number : this.number,
    jackpot : this.jackpot,
    createdAt:this.createdAt,
    updatedAt:this.updatedAt
  };
};



const GameHistory = mongoose.model('GameHistory', GameHistorySchema);

export default GameHistory;