import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, resetConfig } from '../src/config.js';

describe('loadConfig', () => {
  beforeEach(() => {
    resetConfig();
  });

  afterEach(() => {
    resetConfig();
  });

  it('should load default config when no yaml file exists', () => {
    const config = loadConfig('/tmp/nonexistent/config.yaml');
    expect(config).toBeDefined();
    expect(config.settings).toBeDefined();
    expect(config.settings.email_interval_min).toBe(180);
    expect(config.settings.email_interval_max).toBe(420);
  });

  it('should have default harvest config', () => {
    const config = loadConfig('/tmp/nonexistent/config.yaml');
    expect(config.harvest.topics).toBeInstanceOf(Array);
    expect(config.harvest.target_repos).toBeInstanceOf(Array);
    expect(config.harvest.per_repo_limit).toBe(100);
  });

  it('should have debug config', () => {
    const config = loadConfig('/tmp/nonexistent/config.yaml');
    expect(config.debug.dry_run).toBe(false);
    expect(config.debug.log_level).toBe('info');
  });

  it('should apply DRY_RUN env override', () => {
    process.env.DRY_RUN = 'true';
    const config = loadConfig('/tmp/nonexistent/config.yaml');
    expect(config.debug.dry_run).toBe(true);
    delete process.env.DRY_RUN;
  });

  it('should cache config after first load', () => {
    const config1 = loadConfig('/tmp/nonexistent/config.yaml');
    const config2 = loadConfig('/tmp/nonexistent/config.yaml');
    expect(config1).toBe(config2); // 同一个引用
  });

  it('should reset config cache', () => {
    const config1 = loadConfig('/tmp/nonexistent/config.yaml');
    resetConfig();
    const config2 = loadConfig('/tmp/nonexistent/config.yaml');
    expect(config1).not.toBe(config2); // 不同的引用
  });
});
