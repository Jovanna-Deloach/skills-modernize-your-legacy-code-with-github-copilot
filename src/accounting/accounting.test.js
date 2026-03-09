const path = require('node:path');

let app = require('./index');

function createMockRl(answers) {
  let index = 0;

  return {
    prompts: [],
    closed: false,
    async question(prompt) {
      this.prompts.push(prompt);
      if (index >= answers.length) {
        throw new Error('No more mock answers available.');
      }
      const answer = answers[index];
      index += 1;
      return String(answer);
    },
    close() {
      this.closed = true;
    },
  };
}

async function runSession(answers) {
  const rl = createMockRl(answers);
  const logs = [];
  await app.mainProgram({
    rl,
    logger: (message) => logs.push(String(message)),
  });

  return { logs, rl };
}

beforeEach(() => {
  app.resetStorageBalance();
});

test('TC-001 displays the main menu options on startup', async () => {
  const { logs } = await runSession([4]);

  expect(logs).toContain('Account Management System');
  expect(logs).toContain('1. View Balance');
  expect(logs).toContain('2. Credit Account');
  expect(logs).toContain('3. Debit Account');
  expect(logs).toContain('4. Exit');
});

test('TC-002 handles invalid menu selection and continues loop', async () => {
  const { logs } = await runSession([9, 4]);

  expect(logs).toContain('Invalid choice, please select 1-4.');
  const menuCount = logs.filter((line) => line === 'Account Management System').length;
  expect(menuCount).toBe(2);
});

test('TC-003 exits the program loop when option 4 is selected', async () => {
  const { logs, rl } = await runSession([4]);

  expect(logs).toContain('Exiting the program. Goodbye!');
  expect(rl.closed).toBe(true);
});

test('TC-004 shows initial account balance on first read', async () => {
  const { logs } = await runSession([1, 4]);

  expect(logs).toContain('Current balance: 001000.00');
});

test('TC-005 credits account and increases balance correctly', async () => {
  const { logs } = await runSession([2, 200, 1, 4]);

  expect(logs).toContain('Amount credited. New balance: 001200.00');
  expect(logs).toContain('Current balance: 001200.00');
});

test('TC-006 debits account when funds are sufficient', async () => {
  const { logs } = await runSession([3, 150, 1, 4]);

  expect(logs).toContain('Amount debited. New balance: 000850.00');
  expect(logs).toContain('Current balance: 000850.00');
});

test('TC-007 rejects debit when funds are insufficient', async () => {
  const { logs } = await runSession([3, 999999.99, 1, 4]);

  expect(logs).toContain('Insufficient funds for this debit.');
  expect(logs).toContain('Current balance: 001000.00');
});

test('TC-008 allows debit equal to current balance', async () => {
  const { logs } = await runSession([3, 1000, 1, 4]);

  expect(logs).toContain('Amount debited. New balance: 000000.00');
  expect(logs).toContain('Current balance: 000000.00');
});

test('TC-009 persists balance changes through multiple operations in one run', async () => {
  const { logs } = await runSession([2, 100, 3, 40, 1, 4]);

  expect(logs).toContain('Current balance: 001060.00');
});

test('TC-010 resets balance after application restart', async () => {
  await runSession([2, 250, 4]);

  jest.resetModules();
  app = require('./index');

  const { logs } = await runSession([1, 4]);
  expect(logs).toContain('Current balance: 001000.00');
});

test('TC-011 credit of zero does not change balance', async () => {
  const { logs } = await runSession([2, 0, 1, 4]);

  expect(logs).toContain('Current balance: 001000.00');
});

test('TC-012 debit of zero does not change balance', async () => {
  const { logs } = await runSession([3, 0, 1, 4]);

  expect(logs).toContain('Current balance: 001000.00');
});

test('TC-013 returns to menu after each non-exit action', async () => {
  const { logs } = await runSession([1, 2, 10, 3, 5, 4]);

  const menuCount = logs.filter((line) => line === 'Account Management System').length;
  expect(menuCount).toBe(4);
});

test('TC-014 data read/write flow reflects latest values after each operation', async () => {
  const { logs } = await runSession([1, 2, 75, 1, 3, 25, 1, 4]);

  const balances = logs.filter((line) => line.startsWith('Current balance:'));
  expect(balances).toEqual([
    'Current balance: 001000.00',
    'Current balance: 001075.00',
    'Current balance: 001050.00',
  ]);
});
