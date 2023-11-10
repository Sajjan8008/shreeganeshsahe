import mongoose from 'mongoose';

const { Schema } = mongoose;

const BettingSchema = new Schema(
  {
   
    name: {
      type: String,
      required: true,
    },
    ticket_id: {
	      type: Number,
        default: 0
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
    claim: {
      type: Boolean,
      default: false,
    },
    win_status: {
      type: Boolean,
      default: false,
    },

    localid: {
      type: Number,
      default: 0
  },

    // Take from token
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    betting_type: { type: mongoose.Schema.Types.ObjectId, ref: 'BettingType' },
    game_history: { type: mongoose.Schema.Types.ObjectId, ref: 'GameHistory' },
    
    // will take from betting type
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    
    tokens: {
      type:Array,
    },
    status: {
      type: String,
      enum : ['completed','cancelled'],
      default: 'completed'
  },
  byBoat: {
    type:Boolean,
    default:false
  }
    // tokens: [{type : mongoose.Schema.Types.ObjectId , ref: 'Token'}],
   
  },
  { timestamps: true },
);



BettingSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    name:this.name,
    amount:this.amount,
    numbers:this.numbers,
    winning: this.winning,
    win_status:this.win_status,
    user: this.user,
    claim: this.claim,
    betting_type: this.betting_type,
    game: this.game,
    game_history:this.game_history,
    tokens: this.tokens,
    status : this.status,
    ticket_id : this.ticket_id,
    localid: this.localid,
    byBoat : this.byBoat
  };
};



const Betting = mongoose.model('Betting', BettingSchema);

export default Betting;
