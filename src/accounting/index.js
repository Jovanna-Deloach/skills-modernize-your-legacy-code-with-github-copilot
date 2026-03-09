const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const OPERATION_CODES = {
  TOTAL: 'TOTAL ',
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT ',
  READ: 'READ',
  WRITE: 'WRITE',
};

let storageBalance = 1000.0;

function formatBalance(value) {
  const normalized = Number(value);
  const [integerPart, fractionalPart] = normalized.toFixed(2).split('.');
  return `${integerPart.padStart(6, '0')}.${fractionalPart}`;
}

function resetStorageBalance(value = 1000.0) {
  storageBalance = Number(value);
}

function dataProgram(passedOperation, balance) {
  const operationType = passedOperation;

  if (operationType === OPERATION_CODES.READ) {
    return storageBalance;
  }

  if (operationType === OPERATION_CODES.WRITE) {
    storageBalance = balance;
  }

  return storageBalance;
}

async function operations(passedOperation, rl, logger = console.log) {
  const operationType = passedOperation;
  let amount = 0;
  let finalBalance = 1000.0;

  if (operationType === OPERATION_CODES.TOTAL) {
    finalBalance = dataProgram(OPERATION_CODES.READ, finalBalance);
    logger(`Current balance: ${formatBalance(finalBalance)}`);
    return;
  }

  if (operationType === OPERATION_CODES.CREDIT) {
    const answer = await rl.question('Enter credit amount: ');
    amount = Number(answer);

    finalBalance = dataProgram(OPERATION_CODES.READ, finalBalance);
    finalBalance += amount;
    dataProgram(OPERATION_CODES.WRITE, finalBalance);
    logger(`Amount credited. New balance: ${formatBalance(finalBalance)}`);
    return;
  }

  if (operationType === OPERATION_CODES.DEBIT) {
    const answer = await rl.question('Enter debit amount: ');
    amount = Number(answer);

    finalBalance = dataProgram(OPERATION_CODES.READ, finalBalance);

    if (finalBalance >= amount) {
      finalBalance -= amount;
      dataProgram(OPERATION_CODES.WRITE, finalBalance);
      logger(`Amount debited. New balance: ${formatBalance(finalBalance)}`);
    } else {
      logger('Insufficient funds for this debit.');
    }
  }
}

async function mainProgram(options = {}) {
  const logger = options.logger || console.log;
  const rl = options.rl || readline.createInterface({ input, output });
  let continueFlag = 'YES';

  try {
    while (continueFlag !== 'NO') {
      logger('--------------------------------');
      logger('Account Management System');
      logger('1. View Balance');
      logger('2. Credit Account');
      logger('3. Debit Account');
      logger('4. Exit');
      logger('--------------------------------');

      const choiceInput = await rl.question('Enter your choice (1-4): ');
      const userChoice = Number(choiceInput);

      switch (userChoice) {
        case 1:
          await operations(OPERATION_CODES.TOTAL, rl, logger);
          break;
        case 2:
          await operations(OPERATION_CODES.CREDIT, rl, logger);
          break;
        case 3:
          await operations(OPERATION_CODES.DEBIT, rl, logger);
          break;
        case 4:
          continueFlag = 'NO';
          break;
        default:
          logger('Invalid choice, please select 1-4.');
          break;
      }
    }

    logger('Exiting the program. Goodbye!');
  } finally {
    rl.close();
  }
}

module.exports = {
  OPERATION_CODES,
  formatBalance,
  dataProgram,
  operations,
  mainProgram,
  resetStorageBalance,
};

if (require.main === module) {
  mainProgram().catch((error) => {
    console.error('Unexpected runtime error:', error);
    process.exitCode = 1;
  });
}
