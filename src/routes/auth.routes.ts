import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { authMiddleware } from '../middleware/auth.middleware';

const router: Router = express.Router();

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

router.get('/protected-route', authMiddleware, (req: Request, res: Response) => {
  res.json({ message: 'This is protected', user: req.user });
});

export default router;
