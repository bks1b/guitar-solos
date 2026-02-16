import { User } from '../util';

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}