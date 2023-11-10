import mongoose from 'mongoose';


const { Schema } = mongoose;

const SettingSchema = new Schema(
  {
    // Roulte settings
    // Time roulte_inertvals between two games.
    // before stop betting time
    // Red color time 
    // Roultte number random/take minimum bet amount/
    // Maximum bet condition in roullte
    name: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      unique: true,
      lowercase: true,   
    },
    value: {
      type: String,
    },
    orderby: {
      type: Number,
    }, 
    halptext: {
      type: String,
    },
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    filter: {
      type: String,
      default: '',
    }
  }
);



SettingSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    name: this.name,
    value: this.value,
    orderby : this.orderby,
    halptext:this.halptext,
    game:this.game
  };
};



const Setting = mongoose.model('Setting', SettingSchema);

export default Setting;