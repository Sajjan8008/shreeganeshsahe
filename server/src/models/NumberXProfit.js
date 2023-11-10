import mongoose from 'mongoose';

const { Schema } = mongoose;

const NumberXProfitSchema = new Schema(
  {
    game_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Game'},
    count: {
      type: Number,
    },
    winning_x: {
        type: Number,
    },
    discription: {
        type: String,
    }
  },
);

NumberXProfitSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    game_id: this.game_id,
    count: this.count,
    winning_x: this.winning_x,
    discription:this.discription,
  };
};

const NumberXProfit = mongoose.model('NumberXProfit', NumberXProfitSchema);

export default NumberXProfit;