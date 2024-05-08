import express, { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { authMiddleware } from '../src/middleware/auth.middleware';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async signUp(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await this.userService.createUser(req.body);
            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    async signIn(req: Request, res: Response, next: NextFunction) {
        try {
            const token = await this.userService.authenticateUser(req.body);
            res.status(200).json({ token });
        } catch (error) {
            next(error);
        }
    }

    async verifyToken(req: Request, res: Response) {
        res.status(200).json({ user: req.user });
    }

    async viewProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await this.userService.getUserById((req.user as any).id);
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async editProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await this.userService.updateUser((req.user as any).id, req.body);
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }
}

const userController = new UserController();
const router = express.Router();

router.post('/signup', userController.signUp.bind(userController));
router.post('/signin', userController.signIn.bind(userController));
router.get('/verify-token', authMiddleware, userController.verifyToken.bind(userController));
router.get('/profile', authMiddleware, userController.viewProfile.bind(userController));
router.put('/profile', authMiddleware, userController.editProfile.bind(userController));

export default router;
