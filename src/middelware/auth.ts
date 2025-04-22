import jwt, { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ErrorObject } from '../lib'; // Update path as needed

// Optional: Define the shape of the user data you embed in the token
interface TokenPayload {
  id: string;
  email: string;
  role: 'User' | 'Admin';
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware: Creates JWT token
 */
export const createToken = (userData: TokenPayload): string => {
  const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE!.replace(/\\n/g, "\n");

  const privateKey = {
    key: JWT_PRIVATE_KEY as string,
    passphrase: process.env.JWT_SECRET as string,
  };

  const options: SignOptions = {
    algorithm: 'RS256',
    expiresIn: parseInt(process.env.TOKEN_TIME as string),
  };

  return jwt.sign(userData, privateKey, options);
};

/**
 * Middleware: Verifies JWT token from Authorization header
 */
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC!.replace(/\\n/g, "\n");  

    let sentToken = req.get('Authorization');

    if (!sentToken) {
      throw new ErrorObject(401, 'Authorization token is not provided');
    }

    if (!sentToken.startsWith('Bearer ')) {
      throw new ErrorObject(400, 'Authorization header format must be: Bearer <token>');
    }

    sentToken = sentToken.split('Bearer ')[1].trim();

    const publicKey = JWT_PUBLIC_KEY as string;


    const options: VerifyOptions = {
      algorithms: ['RS256'],
      maxAge: process.env.TOKEN_TIME as string
    };

    const decoded = jwt.verify(sentToken, publicKey, options) as TokenPayload;

    if (!decoded || typeof decoded != 'object') {
      throw new ErrorObject(401, 'Invalid Authorization token');
    }

    req.user = decoded
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new ErrorObject(403, 'Authorization token has expired'));
    } else if (err instanceof ErrorObject) {
      next(err);
    } else {
      next(new ErrorObject(401, 'Invalid Authorization token'));
    }
  }
};

export const authorize = (role: 'Admin' | 'User') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      throw new ErrorObject(403, 'Access denied');
    }
    next();
  };
};




