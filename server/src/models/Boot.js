import mongoose from 'mongoose';

const { Schema } = mongoose;

const BootSchema = new Schema(
  {
   
    maxPlayer: Number,
    bootValue: Number,
    minimum_entry: Number,
    chaalLimit: Number,
    potLimit: Number,
    activeUsers: {
      type: Number,
      default: 250
    }
  }
);



BootSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    maxPlayer: this.maxPlayer,
    bootValue:this.bootValue,
    minimum_entry: this.minimum_entry,
    chaalLimit:this.chaalLimit,
    potLimit : this.potLimit,
    activeUsers: this.activeUsers

  };
};



const Boot = mongoose.model('Boot', BootSchema);

export default Boot;