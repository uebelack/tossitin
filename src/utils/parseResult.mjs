function parseResult(input) {
  const text = typeof input === 'string' ? input : input?.content || '';
  if (text.indexOf('</think>') !== -1) {
    const end = text.indexOf('</think>');
    return text.substring(end + 8).trim();
  }
  return text.trim();
}

export default parseResult;
