// import { timestamp } from 'joi/lib/types/date.js';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const GameConnectBoatSchema = new Schema(
  {
   
    gameid: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalUser: {
      type: Number
    }
  }
);



GameConnectBoatSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    gameid: this.gameid,
    userid:this.userid,
    totalUser : this.totalUser
  };
  
};



const GameConnectBoat = mongoose.model('GameConnectBoat', GameConnectBoatSchema);

export default GameConnectBoat;