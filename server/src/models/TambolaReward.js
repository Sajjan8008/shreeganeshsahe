import mongoose from 'mongoose';

const { Schema } = mongoose;

const TambolaRewardSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    count: {
      type: Number,
      required: [true, "can't be blank"],
    },
    status: {
      type: Boolean,
      default: false
    }
  }
);

TambolaRewardSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    name: this.name,
    count: this.count,
    status: this.status
  };
};



const TambolaReward = mongoose.model('TambolaReward', TambolaRewardSchema);

export default TambolaReward;