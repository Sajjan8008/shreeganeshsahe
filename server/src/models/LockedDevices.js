import mongoose from 'mongoose';

const { Schema } = mongoose;

const LockedDevicesSchema = new Schema(
  {
   
    deviceid: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      unique: true,
    }
  },
  { timestamps: true }
);



LockedDevicesSchema.methods.toJSON = function () {
  
  return {
    id: this._id,
    deviceid: this.deviceid,
    createdAt : this.createdAt,
    updatedAt : this.updatedAt
  };
};



const LockedDevices = mongoose.model('LockedDevices', LockedDevicesSchema);

export default LockedDevices;