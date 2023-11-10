import mongoose from 'mongoose';

const { Schema } = mongoose;

const BoatBettingSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    numbers: {
      type:Array,
      required: true,
    },
    winning: {
      type: Number,
      required: true,
    },
    win_status: {
      type: Boolean,
      default: false,
    },
    game_history: { type: mongoose.Schema.Types.ObjectId, ref: 'GameHistory' },
    betting_type: { type: mongoose.Schema.Types.ObjectId, ref: 'BettingType' },
    boat: { type: mongoose.Schema.Types.ObjectId, ref: 'BoatUser' } ,
    status: {
      type: String,
      default: 'completed'
  },
  },
);



BoatBettingSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    name:this.name,
    amount:this.amount,
    numbers:this.numbers,
    winning: this.winning,
    win_status:this.win_status,
    game_history:this.game_history,
    betting_type: this.betting_type,
    boat: this.boat,
    status : this.status
  };
};



const BoatBetting = mongoose.model('BoatBetting', BoatBettingSchema);

export default BoatBetting;
