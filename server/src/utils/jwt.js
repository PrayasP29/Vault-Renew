import jwt from "jsonwebtoken";
import crypto from "crypto";

const getSecret = (name) => {
  const secret = process.env[name];
  if (!secret) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return secret;
};

export const generateAccessToken = (userId) =>
  jwt.sign({ userId }, getSecret("JWT_SECRET"), {
    algorithm: "HS256",
    expiresIn: "3h",
  });

export const generateRefreshToken = (userId) =>
  jwt.sign(
    { userId: String(userId), jti: crypto.randomUUID() },
    getSecret("JWT_REFRESH_SECRET"),
    {
      algorithm: "HS256",
      expiresIn: "7d",
    }
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, getSecret("JWT_SECRET"), { algorithms: ["HS256"] });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, getSecret("JWT_REFRESH_SECRET"), { algorithms: ["HS256"] });
