/**
 * Spintax 随机内容生成器
 *
 * 6 层随机组合，生成独一无二的邮件内容
 * 主题 × 问候 × 开场 × 价值点 × 结尾 × 签名 = 100,000+ 种组合
 *
 * 策略：纯文本、无链接、无 HTML（避免反垃圾引擎扫描）
 */

interface SpintaxPool {
  subjects: string[];
  greetings: string[];
  openings: string[];
  valueProps: string[];
  closings: string[];
  signatures: string[];
}

const SPINTAX: SpintaxPool = {
  // 邮件主题（10 个变体）
  subjects: [
    '🚀 发现一个超强的 AI 编程助手',
    '🔧 Claude Code + 微信 = ？',
    '💡 一个让手机写代码的开源工具',
    '🤖 AI 编程的新玩法',
    '📱 手机发消息，电脑写代码',
    '🌟 开源工具推荐：AI + IM',
    '🎯 开发者必备：远程 AI 编程',
    '💬 通过微信使用 Claude Code',
    '🚀 AI 编程效率提升 10 倍',
    '🔧 开源项目推荐（AI 编程方向）',
  ],

  // 问候语（8 个变体）
  greetings: [
    'Hi {name}',
    'Hello {name}',
    'Hey {name}',
    'Hi there {name}',
    'Hey there {name}',
    'Hi {name}, fellow dev',
    'Hello {name}',
    'Hi {name}',
  ],

  // 开场白（10 个变体）
  openings: [
    '我在 GitHub 上看到了你的项目，印象很深。',
    '看到你对 AI 编程工具很感兴趣。',
    '注意到你在关注一些 AI 相关的开源项目。',
    '最近在探索 AI 编程工具，发现了一个很有意思的项目。',
    '作为一个开发者，你可能会对这个感兴趣。',
    '在 GitHub 上看到你 star 了一些 AI 项目，推荐一个给你。',
    '看到你在用 AI 工具辅助开发，这个项目你可能会喜欢。',
    '作为一个同样关注 AI 编程的人，想跟你分享一个工具。',
    '在研究 AI 编程工具时发现了这个开源项目。',
    '你的 GitHub 活动显示你对新技术很感兴趣。',
  ],

  // 价值点（10 个变体）
  valueProps: [
    'open-im 是一个开源工具，可以把 Claude Code 接入微信、Telegram 等 IM 平台。手机发条消息，电脑上就写好代码。',
    'open-im 让你在手机上直接跟 Claude Code 对话，代码自动在电脑上写好。支持微信、Telegram 等 7 个 IM 平台。',
    '通过 open-im，你可以在微信里直接使用 Claude Code。手机发消息，电脑写代码，效率翻倍。',
    'open-im 把 Claude Code 变成了你的微信好友。随时随地用手机给 AI 发指令，代码在电脑上自动生成。',
    'open-im 是一个把 AI 编程助手接入即时通讯的工具。你在微信发消息，Claude Code 就在电脑上帮你写代码。',
    '用 open-im，你可以通过 Telegram 直接调用 Claude Code。手机就是你的 AI 编程遥控器。',
    'open-im 支持 Claude、Codex、CodeBuddy 等多个 AI 编程助手。通过微信、Telegram 等 7 个平台随时随地编程。',
    '开源项目 open-im 解决了一个痛点：如何在手机上方便地使用 AI 编程助手。支持多个 IM 平台。',
    'open-im 让 AI 编程不再受设备限制。手机发指令，电脑写代码，支持微信和 Telegram 等平台。',
    '想象一下：在微信里发一条消息，Claude Code 就在你的电脑上开始写代码。open-im 让这成为现实。',
  ],

  // 结尾（8 个变体）
  closings: [
    '如果你也在用 AI 编程工具，欢迎试试。有问题可以提 Issue。',
    '感兴趣的话可以看看。完全开源，欢迎 Star 和贡献。',
    '这是一个完全开源的项目，欢迎体验和反馈。',
    '如果觉得有用，欢迎给个 Star 支持一下。',
    '项目完全开源，欢迎试用和交流。',
    '如果你有好的想法，也欢迎提 PR 参与贡献。',
    '开源项目，欢迎体验。有任何建议都可以在 Issue 里提。',
    '希望对你有帮助。有问题随时交流。',
  ],

  // 签名（8 个变体）
  signatures: [
    'Best,\nopen-im 团队',
    'Thanks,\nopen-im 开发者',
    'Best regards,\nopen-im',
    'Cheers,\nopen-im',
    '祝好,\nopen-im 团队',
    '谢谢,\nopen-im 开发者',
    '此致,\nopen-im',
    'Best,\n一个 AI 编程爱好者',
  ],
};

/**
 * 从数组中随机选择一个元素
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 清理收件人名称（移除特殊字符和数字）
 */
export function sanitizeName(name: string): string {
  if (!name) return 'there';
  // 移除特殊字符和数字，保留字母和空格
  const cleaned = name.replace(/[^a-zA-Z\s一-鿿]/g, '').trim();
  return cleaned || 'there';
}

/**
 * 生成随机邮件主题
 */
export function generateSubject(): string {
  return pickRandom(SPINTAX.subjects);
}

/**
 * 生成随机邮件正文
 */
export function generateBody(recipientName?: string): string {
  const name = sanitizeName(recipientName || '');

  const greeting = pickRandom(SPINTAX.greetings).replace('{name}', name || 'there');
  const opening = pickRandom(SPINTAX.openings);
  const valueProp = pickRandom(SPINTAX.valueProps);
  const closing = pickRandom(SPINTAX.closings);
  const signature = pickRandom(SPINTAX.signatures);

  return `${greeting},\n\n${opening}\n\n${valueProp}\n\n${closing}\n\n${signature}`;
}

/**
 * 生成完整的随机邮件内容（主题 + 正文）
 */
export function generateEmail(recipientName?: string): { subject: string; text: string } {
  return {
    subject: generateSubject(),
    text: generateBody(recipientName),
  };
}

/**
 * 获取组合总数（用于日志）
 */
export function getCombinationCount(): number {
  return (
    SPINTAX.subjects.length *
    SPINTAX.greetings.length *
    SPINTAX.openings.length *
    SPINTAX.valueProps.length *
    SPINTAX.closings.length *
    SPINTAX.signatures.length
  );
}
