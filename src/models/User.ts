import { Document, model, Schema } from 'mongoose';

export type UserType = 'telegram' | 'twitter';

export interface IUser {
  id: string;
  name: string;
  username: string;
  type: UserType;
}

// Define the User interface
export interface UserDocument extends Document {
  id: string;
  username: string;
  name: string;
  type: string;
}

// Define the User schema
const userSchema = new Schema<UserDocument>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, default: 'twitter' },
});

// Create the User model
const UserModel = model<UserDocument>('User', userSchema);

export default UserModel;
