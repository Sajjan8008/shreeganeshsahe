import mongoose from 'mongoose';

const { Schema } = mongoose;


const BootSchema = new Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    socketid: String,
    roomid: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    cardseen: {
      type: Boolean,
      default: false
    },
    chaalValue:{
      type:Number,
      default:0
    },
    sumChaalValue: {
      type:Number,
      default:0
    },
    roundCount : {
      type:Number,
      default:0
    },
    cards: [],
    cardsType: String,
    cardScore: {
      type: Number,
      default: 0
    },
    seat: Number,
    packed:Boolean,
    watching: Boolean,
    waiting: Boolean,
    rising : Boolean,
    sideshowAsked:{
      type: Number,
      default: 0
    },
    sideshowAskedBy: {
      type: Number,
      default: 0
    },
    playCounter: {
      type : Number,
      default: 0
    }
  }
);



BootSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    userid: this.userid,
    socketid:this.socketid,
    roomid: this.roomid,
    chaalValue:this.chaalValue,
    sumChaalValue: this.sumChaalValue,
    roundCount: this.roundCount,
    cardseen:this.cardseen,
    cards : this.cards,
    cardsType : this.cardsType,
    cardScore:this.cardScore,
    seat: this.seat,
    watching: this.watching,
    waiting: this.waiting,
    packed: this.packed,
    rising : this.rising,
    playCounter : this.playCounter
  };
};



const Boot = mongoose.model('PlayingData', BootSchema);

export default Boot;