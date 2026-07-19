import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectedRoute = async (req, res, next) => {
  try {
    //lay access token tu header Authorization
    const authHeader = req.headers['authorization']; //lay header Authorization tu request client gui len
    const token = authHeader && authHeader.split(' ')[1]; //Bearer <token>

    if (!token) {
      return res.status(401).json({ message: 'Not found access token' });
    }

    //xac minh token hop le
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, decodedUser) => {
        if (err) {
          console.error(err);

          return res.status(403).json({ message: 'Invalid access token' });
        }

        //tim user hop le
        const user = await User.findById(decodedUser.userId).select(
          '-hashedPassword'
        );

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        //tra user ve trong req
        req.user = user;
        next();
      }
    );
  } catch (error) {
    console.error('Error in authentication in middleware:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
