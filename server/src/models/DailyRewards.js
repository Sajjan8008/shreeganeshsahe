import mongoose from 'mongoose';

const { Schema } = mongoose;

const DailyRewardsSchema = new Schema(
  {
    day: {
      type: Number,
      required: [true, "can't be blank"],
      index: true,
      unique: true,
    },
    rewards: {
      type: Number,
      required: [true, "can't be blank"],
    },
    
  }
);

DailyRewardsSchema.methods.toJSON = function () {
  
  return {
    id: this.id,
    day:this.day,
    rewards: this.rewards
  };
};


const DailyRewards = mongoose.model('DailyRewards', DailyRewardsSchema);

export default DailyRewards;