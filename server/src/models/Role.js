import mongoose from 'mongoose';

const { Schema } = mongoose;

const RoleSchema = new Schema(
  {
   id:{
     type: Number,
     unique: true,
     required:[true, "Must be fill"]
   },
    name: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
    },
    
  }
);

RoleSchema.methods.toJSON = function () {
  
  return {
    _id: this._id,
    id: this.id,
    name: this.name,
  };
};



const Role = mongoose.model('Role', RoleSchema);

export default Role;