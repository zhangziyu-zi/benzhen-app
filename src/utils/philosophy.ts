export const quotes = [
  '美是作为"存在"的缺席而开始显现的。',
  '变美，不是一个叠加，而是一场删减。',
  '祛除社会目光在你身上烙下的"非我"，本质的灵韵开始透气。',
  '你不再是被动承受岁月刻刀的石料，而是拿起刻刀的自己。',
  '每一分努力，都是精神赋予物质以合目的性的形式。',
  '这不是向着他者的献媚，而是向着"本我"的回归。',
  '你不再追问"我看起来如何？"，而是宣布"我选择如此存在"。',
  '从"被观看的客体"重塑为"感受自身的主体"。',
  '美，是自由意志在感性世界中的胜利。',
  '保持好习惯的人都是狠人，不分男女。',
  '决定人过得好坏的，是心态。',
  '热爱是对待所有事故，慈悲是对待所有人情。',
  '好的习惯养成要很久，破坏只是一朝一夕的事情。',
]

export function getDailyQuote(): string {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % quotes.length
  return quotes[index]
}
