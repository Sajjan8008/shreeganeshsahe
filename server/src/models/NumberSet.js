import mongoose from 'mongoose';

const { Schema } = mongoose;

const NumberSetSchema = new Schema(
  {
    gameid: {
      type: String,
      required: [true, "can't be blank"],
    },
    number: {
      type: String,
      required: [true, "can't be blank"],
    },
  },
  { timestamps: true },
);



NumberSetSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    gameid: this.gameid,
    number: this.number,
  };
};



const NumberSet = mongoose.model('NumberSet', NumberSetSchema);

export default NumberSet;