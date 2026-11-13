import { execa } from "execa";

async function execute(command) {
  const { all } = await execa(command, { shell: true, all: true });
  return all;
}
export default execute;
