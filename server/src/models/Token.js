import mongoose from 'mongoose';

const { Schema } = mongoose;

const TokenSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    coins: {
      type: Number,
      required: [true, "can't be blank"],
    },
    notAllowedGames: {
      type: Array,
      default:[]
    },
    status: {
      type:Boolean ,
      default: true,
    },
  },
  { timestamps: true },
);



TokenSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    name: this.name,
    coins: this.coins,
    status: this.status
  };
};



const Token = mongoose.model('Token', TokenSchema);

export default Token;