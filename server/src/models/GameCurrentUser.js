import mongoose from 'mongoose';

const { Schema } = mongoose;

const GameCurrentUserSchema = new Schema(
  {
   
    gameid: {
      type: String,
    },
    users: {
      type:Array ,
      default: [],
    },
  },
  { timestamps: true },
);



GameCurrentUserSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    gameid: this.gameid,
    users:this.users,
  };
};



const GameCurrentUser = mongoose.model('GameCurrentUser', GameCurrentUserSchema);

export default GameCurrentUser;