import { Layers, Node, SpriteFrame, UITransform, Vec2 } from 'cc'

const INDEX_REG = /\((\d+)\)/;

const getNumberWithinString = (str: string) => parseInt(str.match(INDEX_REG)?.[1] || "0");

export const sortSpriteFrame = (spriteFrame: Array<SpriteFrame>) =>
  spriteFrame.sort((a, b) => getNumberWithinString(a.name) - getNumberWithinString(b.name));

const getUIMaskNumber = () => 1 << Layers.nameToLayer('UI_2D')
export const createUINode = (name: string = '') => {
  const node = new Node(name)
  node.layer = getUIMaskNumber()
  const transform = node.addComponent(UITransform)
  transform.anchorPoint = new Vec2(0, 1)
  return node
}

  // 弧度转成角度
export const radToAngle = (rad: number) => {
  return rad / Math.PI * 180
}

export const deepClone = (obj: any) => {
  if(typeof obj !== 'object' || obj === null){
    return obj
  }

  const res = Array.isArray(obj) ? [] : {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const element = obj[key];
      res[key] = deepClone(obj[key])
    }
  }
  return res
}

// 暴击率
export const randomBySeed = (seed: number) => {
  return (seed * 9301 + 49297) % 233280
}

export const toFixed = (num, digit = 3) => {
    const scale = 10 ** digit
    return Math.floor(num * scale) / scale
}

