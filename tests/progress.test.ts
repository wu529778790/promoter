import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ProgressManager } from '../src/progress.js';

describe('ProgressManager', () => {
  let pm: ProgressManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'progress-test-'));
    pm = new ProgressManager(tempDir);
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  describe('markSent', () => {
    it('should mark email as sent', () => {
      pm.markSent('test@example.com', 'sender1');
      expect(pm.isSent('test@example.com')).toBe(true);
    });

    it('should track multiple sent emails', () => {
      pm.markSent('a@test.com', 'sender1');
      pm.markSent('b@test.com', 'sender1');
      expect(pm.isSent('a@test.com')).toBe(true);
      expect(pm.isSent('b@test.com')).toBe(true);
    });

    it('should track sender stats', () => {
      pm.markSent('a@test.com', 'sender1');
      pm.markSent('b@test.com', 'sender1');
      const snapshot = pm.getSnapshot();
      expect(snapshot.senderStats['sender1'].sent).toBe(2);
    });
  });

  describe('markFailed', () => {
    it('should track failed count', () => {
      pm.markFailed('test@example.com', 'sender1', 'timeout');
      const snapshot = pm.getSnapshot();
      expect(snapshot.senderStats['sender1'].failed).toBe(1);
    });
  });

  describe('isSent', () => {
    it('should return false for unsent email', () => {
      expect(pm.isSent('unknown@test.com')).toBe(false);
    });

    it('should return true for sent email', () => {
      pm.markSent('test@test.com', 's1');
      expect(pm.isSent('test@test.com')).toBe(true);
    });
  });

  describe('sender pause', () => {
    it('should pause sender', () => {
      pm.setSenderPaused('sender1', true, Date.now() + 60000);
      expect(pm.isSenderPaused('sender1')).toBe(true);
    });

    it('should resume sender after timeout', () => {
      pm.setSenderPaused('sender1', true, Date.now() - 1000); // 已过期
      expect(pm.isSenderPaused('sender1')).toBe(false);
    });

    it('should resume sender explicitly', () => {
      pm.setSenderPaused('sender1', true, Date.now() + 60000);
      pm.setSenderPaused('sender1', false);
      expect(pm.isSenderPaused('sender1')).toBe(false);
    });
  });

  describe('getSnapshot', () => {
    it('should return correct snapshot', () => {
      pm.setTotal(100);
      pm.markSent('a@test.com', 's1');
      pm.markSent('b@test.com', 's1');
      pm.markFailed('c@test.com', 's1', 'error');

      const snapshot = pm.getSnapshot();
      expect(snapshot.total).toBe(100);
      expect(snapshot.sent).toBe(2);
      expect(snapshot.failed).toBe(1);
      expect(snapshot.remaining).toBe(98);
    });
  });

  describe('persistence', () => {
    it('should save and load progress', () => {
      pm.setTotal(100);
      pm.markSent('a@test.com', 's1');
      pm.save();

      // 新建实例，应该能恢复
      const pm2 = new ProgressManager(tempDir);
      expect(pm2.isSent('a@test.com')).toBe(true);
    });
  });
});
