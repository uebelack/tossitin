import { select } from '@clack/prompts';
import texts from '../texts.mjs';
import branchCommand from './branchCommand.mjs';

async function selectCommand() {
  const result = await select({
    message: '🙋‍♀️ What do you want to do?',
    options: [
      {
        value: 'branch',
        label: `branch - ${texts.commands.branch.description}`,
      },
      {
        value: 'commit',
        label: `commit - ${texts.commands.commit.description}`,
      },
    ],
  });

  switch (result) {
    case 'branch':
      return branchCommand();
    case 'commit':
      return null;
  }
}

export default selectCommand;
