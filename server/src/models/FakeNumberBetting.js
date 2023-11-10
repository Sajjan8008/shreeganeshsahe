import { timestamp } from 'joi/lib/types/date.js';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const FakeNumberSchema = new Schema(
  {
   
    gameid: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    number: {
      type: Number
    },
    amount: {
      type: Number
    }
  }
);



FakeNumberSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    gameid: this.gameid,
    number:this.number,
    amount : this.amount
  };
};



const FakeNumberBetting = mongoose.model('FakeNumberBetting', FakeNumberSchema);

export default FakeNumberBetting;