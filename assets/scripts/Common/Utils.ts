import { SpriteFrame } from 'cc'

const INDEX_REG = /\((\d+)\)/;

const getNumberWithinString = (str: string) => parseInt(str.match(INDEX_REG)?.[1] || "0");

export const sortSpriteFrame = (spriteFrame: Array<SpriteFrame>) =>
  spriteFrame.sort((a, b) => getNumberWithinString(a.name) - getNumberWithinString(b.name));

export const radToAngle = (rad: number) => {
  return rad / Math.PI * 180
}

export const randomBySeed = (seed: number) => {
  return (seed * 9301 + 49297) % 233280
}

export const toFixed = (num, digit = 3) => {
    const scale = 10 ** digit
    return Math.floor(num * scale) / scale
}

