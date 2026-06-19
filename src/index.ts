/**
 * GitHub Promoter - 主入口
 *
 * 用法：
 *   npm run collect                    采集邮箱
 *   npm run collect -- --resume        断点续采
 *   npm run collect -- --status        查看采集进度
 *   npm run collect -- --dry-run       模拟采集
 *
 *   npm run send                       发送推广邮件
 *   npm run send -- --parallel         并行模式
 *   npm run send -- --count 50         限制数量
 *   npm run send -- --dry-run          模拟发送
 *   npm run send -- --status           查看发送状态
 *   npm run send -- --test-connection  测试 SMTP 连接
 */

import { loadConfig } from './config.js';
import { collectEmails } from './collect.js';
import { ParallelSender } from './sender.js';

const args = process.argv.slice(2);
const command = args[0];
const flags = args.slice(1);

async function main() {
  const config = loadConfig();

  switch (command) {
    case 'collect':
      await collectEmails(config, flags);
      break;

    case 'send':
      if (config.senders.length === 0) {
        console.error('❌ 没有配置发件人。请在 config/config.yaml 中配置 senders，或设置 SMTP_USER/SMTP_PASS 环境变量');
        process.exit(1);
      }

      if (flags.includes('--status')) {
        const sender = new ParallelSender(config);
        sender.showStatus();
        break;
      }

      if (flags.includes('--test-connection')) {
        await testConnections(config);
        break;
      }

      // 解析 --count 参数
      let limit: number | undefined;
      const countIdx = flags.indexOf('--count');
      if (countIdx !== -1 && flags[countIdx + 1]) {
        limit = parseInt(flags[countIdx + 1], 10);
      }

      const sender = new ParallelSender(config);
      await sender.start(limit);
      break;

    default:
      printHelp();
  }
}

async function testConnections(config: ReturnType<typeof loadConfig>): Promise<void> {
  console.log('🔌 测试 SMTP 连接...\n');

  for (const sender of config.senders) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: sender.smtp_server,
        port: sender.smtp_port,
        secure: sender.smtp_port === 465,
        auth: {
          user: sender.email,
          pass: sender.password,
        },
      });

      await transporter.verify();
      console.log(`✅ ${sender.name} (${sender.email}) - 连接成功`);
      await transporter.close();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${sender.name} (${sender.email}) - 连接失败: ${msg}`);
    }
  }
}

function printHelp(): void {
  console.log(`
GitHub Promoter - open-im 推广工具

用法:
  npm run collect                    采集 GitHub 用户邮箱
  npm run collect -- --resume        断点续采
  npm run collect -- --status        查看采集进度
  npm run collect -- --dry-run       模拟采集

  npm run send                       发送推广邮件
  npm run send -- --parallel         并行模式（多发件人）
  npm run send -- --count 50         限制发送数量
  npm run send -- --dry-run          模拟发送
  npm run send -- --status           查看发送状态
  npm run send -- --test-connection  测试 SMTP 连接

配置方式（二选一）:
  1. 配置文件: cp config/config.yaml.example config/config.yaml
  2. 环境变量: export GITHUB_TOKEN / SMTP_USER / SMTP_PASS

更多配置选项请参考 config/config.yaml.example
  `);
}

main().catch(console.error);
