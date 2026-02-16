function extractResult(result) {
  var extractedResult = result;

  if (result.content) {
    extractedResult = result.content;
  }
  if (result.messages) {
    extractedResult = result.messages[result.messages.length - 1].content;
  }

  if (extractedResult.indexOf("</think>") !== -1) {
    const end = extractedResult.indexOf("</think>");
    return extractedResult.substring(end + 8).trim();
  }
}

export default extractResult;
