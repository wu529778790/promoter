/**
 * 发送进度管理器
 *
 * 双写持久化：progress.json（快速查询）+ sent_emails.csv（持久记录）
 * 启动时从 CSV 重建已发送集合，防止重复发送
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_DATA_DIR = join(__dirname, '..', 'data');

// ============================================================
// 类型定义
// ============================================================

export interface SenderStats {
  sent: number;
  failed: number;
  paused: boolean;
  pausedUntil: number | null;
}

export interface ProgressData {
  /** 已发送的邮箱集合（快速查找） */
  sentEmails: Set<string>;
  /** 每个发件人的统计 */
  senderStats: Map<string, SenderStats>;
  /** 总计 */
  total: number;
}

export interface ProgressSnapshot {
  sent: number;
  failed: number;
  total: number;
  remaining: number;
  senderStats: Record<string, SenderStats>;
}

// ============================================================
// ProgressManager 类
// ============================================================

export class ProgressManager {
  private sentEmails: Set<string>;
  private senderStats: Map<string, SenderStats>;
  private total: number;
  private dataDir: string;
  private progressFile: string;
  private sentCsvFile: string;
  private sentLogFile: string;

  constructor(dataDir?: string) {
    this.sentEmails = new Set();
    this.senderStats = new Map();
    this.total = 0;
    this.dataDir = dataDir || DEFAULT_DATA_DIR;
    this.progressFile = join(this.dataDir, 'progress.json');
    this.sentCsvFile = join(this.dataDir, 'sent_emails.csv');
    this.sentLogFile = join(this.dataDir, 'sent_log.csv');

    // 确保目录存在
    if (!existsSync(this.dataDir)) mkdirSync(this.dataDir, { recursive: true });

    // 从 CSV 重建已发送集合
    this.rebuildFromCsv();
  }

  /**
   * 标记邮件已发送
   */
  markSent(email: string, senderName: string): void {
    this.sentEmails.add(email);

    // 更新发件人统计
    const stats = this.senderStats.get(senderName) || { sent: 0, failed: 0, paused: false, pausedUntil: null };
    stats.sent++;
    this.senderStats.set(senderName, stats);

    // 写入 CSV
    this.appendToSentCsv(email, senderName, 'sent');
  }

  /**
   * 标记邮件发送失败
   */
  markFailed(email: string, senderName: string, reason: string): void {
    const stats = this.senderStats.get(senderName) || { sent: 0, failed: 0, paused: false, pausedUntil: null };
    stats.failed++;
    this.senderStats.set(senderName, stats);

    this.appendToSentCsv(email, senderName, `failed: ${reason}`);
  }

  /**
   * 检查邮件是否已发送
   */
  isSent(email: string): boolean {
    return this.sentEmails.has(email);
  }

  /**
   * 设置发件人暂停状态
   */
  setSenderPaused(senderName: string, paused: boolean, until?: number): void {
    const stats = this.senderStats.get(senderName) || { sent: 0, failed: 0, paused: false, pausedUntil: null };
    stats.paused = paused;
    stats.pausedUntil = until || null;
    this.senderStats.set(senderName, stats);
  }

  /**
   * 检查发件人是否暂停
   */
  isSenderPaused(senderName: string): boolean {
    const stats = this.senderStats.get(senderName);
    if (!stats || !stats.paused) return false;

    // 检查是否已过暂停时间
    if (stats.pausedUntil && Date.now() > stats.pausedUntil) {
      stats.paused = false;
      stats.pausedUntil = null;
      return false;
    }

    return true;
  }

  /**
   * 设置总邮件数
   */
  setTotal(total: number): void {
    this.total = total;
  }

  /**
   * 获取快照
   */
  getSnapshot(): ProgressSnapshot {
    const sent = this.sentEmails.size;
    let failed = 0;
    for (const stats of this.senderStats.values()) {
      failed += stats.failed;
    }

    const senderStatsObj: Record<string, SenderStats> = {};
    for (const [name, stats] of this.senderStats) {
      senderStatsObj[name] = { ...stats };
    }

    return {
      sent,
      failed,
      total: this.total,
      remaining: this.total - sent,
      senderStats: senderStatsObj,
    };
  }

  /**
   * 持久化进度
   */
  save(): void {
    const data = {
      sentEmails: Array.from(this.sentEmails),
      total: this.total,
      timestamp: new Date().toISOString(),
    };
    writeFileSync(this.progressFile, JSON.stringify(data, null, 2));
  }

  // ============================================================
  // 内部方法
  // ============================================================

  /**
   * 从 CSV 重建已发送集合
   */
  private rebuildFromCsv(): void {
    // 从 sent_emails.csv 重建
    if (existsSync(this.sentCsvFile)) {
      try {
        const csv = readFileSync(this.sentCsvFile, 'utf-8');
        const lines = csv.split('\n').slice(1); // 跳过标题行
        for (const line of lines) {
          if (!line.trim()) continue;
          const [email] = line.split(',');
          if (email) this.sentEmails.add(email.replace(/"/g, '').trim());
        }
      } catch {
        // 忽略
      }
    }

    // 从 sent_log.csv 重建
    if (existsSync(this.sentLogFile)) {
      try {
        const csv = readFileSync(this.sentLogFile, 'utf-8');
        const lines = csv.split('\n').slice(1);
        for (const line of lines) {
          if (!line.trim()) continue;
          const [email] = line.split(',');
          if (email) this.sentEmails.add(email.replace(/"/g, '').trim());
        }
      } catch {
        // 忽略
      }
    }

    // 从 progress.json 恢复旧记录
    if (existsSync(this.progressFile)) {
      try {
        const data = JSON.parse(readFileSync(this.progressFile, 'utf-8'));
        if (data.sentEmails) {
          for (const email of data.sentEmails) {
            this.sentEmails.add(email);
          }
        }
      } catch {
        // 忽略
      }
    }
  }

  /**
   * 追加到发送记录 CSV
   */
  private appendToSentCsv(email: string, sender: string, status: string): void {
    // 确保 CSV 文件有标题
    if (!existsSync(this.sentCsvFile)) {
      writeFileSync(this.sentCsvFile, 'email,sender,status,timestamp\n');
    }

    const timestamp = new Date().toISOString();
    const line = `"${email}","${sender}","${status}","${timestamp}"\n`;
    appendFileSync(this.sentCsvFile, line);
  }
}
