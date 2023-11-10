import mongoose from 'mongoose';

const { Schema } = mongoose;

const TambolaGameHistorySchema = new Schema(
  {
  gameHistory: { type: mongoose.Schema.Types.ObjectId, ref: 'GameHistory' },
  name:{type:String, default: ''},
  start: {
    type: Date,
    required: [true, "can't be blank"],
    index:true
  },
  end: {
      type: Date,
    },
  numbers: {
    type: Array,
    default: []
  },
  jackpotNumber: {
    type: Number,
    default: 0
  },
  jackpotPrice: {
    type: Number,
    default: 0
  },
  loop: {
    type: String,
    default: ''
  },
  ticketSet: {
    type:Number,
    default: 0
  },
  boxes: {
    type: Number,
    default: 0
  },
  ticketPrice: {
    type:Number,
    default:0
  },
  rewards: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'TambolaReward' },
      prize: {type:Number},
      status: { type:Boolean, default: false},
      numberby: {type:Number},
      ticketids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TambolaGameTicket' }],
      isJackPot:{
        type:Boolean,
        default: false
      }
    }
],
  totalBookedTicket: {
      type:Number,
      default:0
  },
  updateNumber: {
    type:Boolean,
    default:false
},
  pendingTransaction: {
    type:Boolean,
    default:false
  },
  videoid: {
    type:String,
    default: ''
  },
  status: {
    type:Boolean,
    default: true
  } 
  
  },
  { timestamps: true },
);

// Query to check small id in 3t
// db.getCollection("tambolagamehistories").aggregate([
//   {
//     $addFields: {
//       tempId: { $toString: '$_id' },
//     }
//   },
//   {
//     $match: {
//       tempId: { $regex: "25e66"}
//     }
//   }
// ])


TambolaGameHistorySchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    idd: (this._id).toString().slice(-6),
    start:this.start,
    end:this.end,
    gameHistory: this.gameHistory,
    name: this.name,
    numbers: this.numbers,
    jackpotNumber: this.jackpotNumber,
    jackpotPrice: this.jackpotPrice,
    loop: this.loop,
    ticketSet: this.ticketSet,
    boxes: this.boxes,
    ticketPrice:this.ticketPrice,
    rewards:this.rewards,
    totalBookedTicket:this.totalBookedTicket,
    updateNumber:this.updateNumber,
    pendingTransaction: this.pendingTransaction,
    videoid:this.videoid,
    status:this.status,
    createdAt:this.createdAt,
    updatedAt:this.updatedAt
  };
};



const TambolaGameHistory = mongoose.model('TambolaGameHistory', TambolaGameHistorySchema);

export default TambolaGameHistory;