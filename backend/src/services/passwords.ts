import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
export function hashPassword(password:string):string {
  const salt=randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}
export function verifyPassword(password:string,stored:string):boolean {
  try {
    if(stored.startsWith('scrypt:')) {
      const [,salt,digest]=stored.split(':');
      const expected=Buffer.from(digest,'hex'),actual=scryptSync(password,salt,64);
      return expected.length===actual.length&&timingSafeEqual(expected,actual);
    }
    const expected=Buffer.from(stored),actual=Buffer.from(password);
    return expected.length===actual.length&&timingSafeEqual(expected,actual);
  }catch{return false;}
}
