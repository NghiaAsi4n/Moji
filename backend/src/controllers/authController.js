import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res) => {
  try {
    //viet object destructuring
    const { username, password, email, firstName, lastName } = req.body;
    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    //kiem tra xem username da ton tai chua
    const duplicate = await User.findOne({ username });
    if (duplicate) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    //ma hoa password
    const hashedPassword = await bcrypt.hash(password, 10); //salt = 10

    //tao user moi
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${lastName} ${firstName}`,
    });

    //return
    return res.sendStatus(204);
  } catch (error) {
    console.error('Error in signUp:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const signIn = async (req, res) => {
  try {
    //lay input nguoi dung gui len tu request body
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Missing username or password' });
    }

    //lay hashedPassword tu db de so sanh voi input password
    //tim user trong db
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    //kiem tra password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    //neu khop, tao access token = JWT
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    //tao session moi de luu refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    //gui refresh token ve trong cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', //be, fe deploy rieng
      maxAge: REFRESH_TOKEN_TTL,
    });

    //tra access token ve response body
    return res.status(200).json({
      message: `User ${user.displayName} logged in successfully!`,
      accessToken,
    });
  } catch (error) {
    console.error('Error in signIn:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const signOut = async (req, res) => {
  try {
    //lay refresh token tu cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      //xoa refresh token trong session
      await Session.deleteOne({ refreshToken: token });

      //xoa cookie
      res.clearCookie('refreshToken');
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error('Error in signOut:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//tao access token tu refresh token
export const refreshToken = async (req, res) => {
  try {
    //lay refresh token tu cookie
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }

    //so voi refresh token trong db
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res.status(403).json({ message: "Token not valid or expired" });
    }

    //ktra het han chua
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token expired" });
    }

    //tao access token moi
    const accessToken = jwt.sign(
      {
        userId: session.userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    //return
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Error in refreshToken:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
