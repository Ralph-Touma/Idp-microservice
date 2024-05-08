import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { UserModel } from '../models/user.model';
import { authMiddleware } from '../middleware/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      userData?: { id: string }; 
  }
}
}
const router: Router = express.Router();

router.use(authMiddleware);

const profileSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  dateOfBirth: Joi.date().required()
});

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { password, ...otherDetails } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ ...otherDetails, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(400).json({ message: 'Error registering user', error });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });
    res.json({ message: 'Logged in successfully!', token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.userData?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile', error });
  }
});

router.put('/profile', async (req: Request, res: Response) => {
  try {
    const { error, value } = profileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Validation error: ' + error.details[0].message });
    }

    const user = await UserModel.findByIdAndUpdate(req.userData?.id, value, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
});

export default router;

