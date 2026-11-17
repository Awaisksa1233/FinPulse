import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateAISummary, processChat, generateBudgetSuggestions, generateStoryReport } from '../src/services/ai.js';

describe('AI Financial Services', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('throws an error if no API key is provided', async () => {
    await expect(generateAISummary('', {})).rejects.toThrow(/not configured/i);
  });

  it('generates financial summaries via Groq / OpenRouter mock', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: 'Your finances are stable this month. Aim to reduce dining expenses by 10%.' } }
        ]
      })
    });

    const summary = await generateAISummary('gsk_testkey', {
      accounts: [{ balance: 3500 }],
      income: 8000,
      expenses: 4500,
      categorySpend: { Dining: 1200, Rent: 2500 }
    });

    expect(summary).toContain('finances are stable');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = globalThis.fetch.mock.calls[0];
    expect(fetchCall[0]).toContain('groq.com');
  });

  it('parses structured JSON action when chat detects a transaction intent', async () => {
    const aiOutput = '{"action":"transaction","type":"expense","amount":45,"account_id":1,"category":"Food","description":"Shawarma lunch","date":"2026-11-17"}';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: aiOutput } }]
      })
    });

    const result = await processChat('sk-or-testkey', [], 'I spent 45 SAR on Shawarma from account 1', {
      accounts: [{ id: 1, name: 'Main' }],
      monthlyIncome: 5000,
      monthlyExpenses: 2000,
    });

    expect(typeof result).toBe('object');
    expect(result.action).toBe('transaction');
    expect(result.amount).toBe(45);
    expect(result.description).toBe('Shawarma lunch');
  });

  it('generates budget suggestions as parsed JSON', async () => {
    const suggestions = [
      { category: 'Groceries', suggested_limit: 1500, reason: 'Historical baseline' }
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(suggestions) } }]
      })
    });

    const result = await generateBudgetSuggestions('gsk_test', {
      categorySpend: { Groceries: 1400 },
      budgets: []
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].category).toBe('Groceries');
    expect(result[0].suggested_limit).toBe(1500);
  });
});
