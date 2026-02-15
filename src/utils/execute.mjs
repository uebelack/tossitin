import { execaCommand } from 'execa';

async function execute(command) {
  const { all } = await execaCommand(command, { shell: true, all: true });
  return all;
}
export default execute;
