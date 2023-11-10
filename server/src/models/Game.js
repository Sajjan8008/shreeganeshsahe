import mongoose from 'mongoose';

const { Schema } = mongoose;

const GameSchema = new Schema(
  {
   
    name: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      unique: true,
    },
    minimumamount: {
      type: Number,
      default:0,
    },
    status: {
      type:Boolean ,
      default: true,
    },
  }
);



GameSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    name: this.name,
    minimumamount:this.minimumamount,
    status:this.status
  };
};



const Game = mongoose.model('Game', GameSchema);

export default Game;