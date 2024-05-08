import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserModel } from '../src/models/user.model';

export class UserService {
  private userModel = UserModel;

  async createUser(data: { email: string, password: string, firstName: string, lastName: string, dob: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new this.userModel({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
    });
    return user.save();
  }

  async authenticateUser(data: { email: string, password: string }) {
    const user = await this.userModel.findOne({ email: data.email });
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid password');
    }

    const token = sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });
    return token;
  }

  async getUserById(userId: string | Types.ObjectId) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUser(userId: string | Types.ObjectId, data: Partial<{ firstName: string, lastName: string, dob: string }>) {
    const user = await this.userModel.findByIdAndUpdate(userId, data, { new: true }).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}
