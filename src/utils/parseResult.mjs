function parseResult(input) {
  if (input.indexOf("</think>") !== -1) {
    const end = input.indexOf("</think>");
    return input.substring(end + 8).trim();
  }
}

export default parseResult;
