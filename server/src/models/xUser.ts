import { Document, model, Schema } from 'mongoose';

// Define the User interface
export interface IUser extends Document {
  id: string;
  username: string;
  name: string;
  type: string;
}

// Define the User schema
const userSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, default: 'twitter' },
});

// Create the User model
const XUser = model<IUser>('User', userSchema);

export default XUser;
