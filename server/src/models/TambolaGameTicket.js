import mongoose from 'mongoose';

const { Schema } = mongoose;

const TambolaGameTicketSchema = new Schema(
  {
    ticketid: {
      type: Number,
      required: [true, "can't be blank"],
      index: true
    },
    numbers : {
      type: Array,
      default: []
    },
    crossed : {
      type: Array,
      default: []
    },
    gameHistory: { type: mongoose.Schema.Types.ObjectId, ref: 'GameHistory' },
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    booked: {type:Boolean, default: false}
  }
);



TambolaGameTicketSchema.methods.toJSON = function () {

  return {
    id: this._id,
    ticketid: this.ticketid,
    numbers:this.numbers,
    crossed:this.crossed,
    gameHistory:this.gameHistory,
    userid:this.userid,
    booked: this.booked
  };
};



const TambolaGameTicket = mongoose.model('TambolaGameTicket', TambolaGameTicketSchema);

export default TambolaGameTicket;