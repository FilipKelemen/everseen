import {SERVER_CONFIG} from "./config.js";
import * as crypto from "crypto"

export function getJWTForUser(user) {
  return generateJWT(user)
}

function generateJWT(user) {
  const {username, password} = user
  const encodedHead = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const encodedBody = Buffer.from(JSON.stringify({
    username,
    exp: Date.now() + SERVER_CONFIG.jwtExpiration,
  })).toString('base64');
  const signature = createSignature(encodedHead, encodedBody)
  return `${encodedHead}.${encodedBody}.${signature}`
}

function createSignature(encodedHead, encodedBody) {
  const data = `${encodedHead}.${encodedBody}`;
  return crypto
    .createHmac('sha256', SERVER_CONFIG.jwtSecret)
    .update(data)
    .digest('base64')
}

export function verifyToken(token) {
  const [encodedHead, encodedBody, signature] = token.split('.');
  const isSignatureValid = verifySignature(encodedHead, encodedBody, signature);
  const isExpired = isTokenExpired(encodedHead)
  return !isExpired && isSignatureValid;
}

function isTokenExpired(encodedHead) {
  const decodedHead = JSON.parse(Buffer.from(encodedHead, 'base64').toString('utf8'));
  return decodedHead.exp <= Date.now();

}

function verifySignature(encodedHead, encodedBody, signature) {
  return createSignature(encodedHead,encodedBody) === signature;
}