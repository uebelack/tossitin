function extractResult(result) {
  if (result.content) {
    return result.content;
  }
  if (result.messages) {
    return result.messages[result.messages.length - 1].content;
  }
  if (result.indexOf("</think>") !== -1) {
    const end = result.indexOf("</think>");
    return result.substring(end + 8).trim();
  }
}

export default extractResult;
