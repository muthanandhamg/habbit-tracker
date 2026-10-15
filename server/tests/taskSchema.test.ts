import { describe, it, expect } from 'vitest';
import { taskCreateSchema, taskUpdateSchema } from 'shared';

// Zod strips unknown keys, so a field missing from the schema is silently dropped by the API
describe('Task schemas', () => {
  it('keeps isMustDo on create', () => {
    const parsed = taskCreateSchema.parse({ title: 'Ship it', isMustDo: true });
    expect(parsed.isMustDo).toBe(true);
  });

  it('defaults isMustDo to false on create', () => {
    expect(taskCreateSchema.parse({ title: 'Ship it' }).isMustDo).toBe(false);
  });

  it('keeps isMustDo on update, and leaves it out when not sent', () => {
    expect(taskUpdateSchema.parse({ isMustDo: true }).isMustDo).toBe(true);
    expect(taskUpdateSchema.parse({ title: 'Renamed' })).not.toHaveProperty('isMustDo');
  });
});
