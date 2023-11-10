import mongoose from 'mongoose';

const { Schema } = mongoose;

const SetsSchema = new Schema(
  {
   numberSet: {
      type: Array,
      required: [true, "can't be blank"],
    },
    winning: {
        type: Number,
        default: 0
      },
  },
);

SetsSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    numberSet: this.numberSet,
    winning: this.winning,
  };
};

const Sets = mongoose.model('Sets', SetsSchema);

export default Sets;