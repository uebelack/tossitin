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
    extractedResult = extractedResult.substring(end + 8).trim();
  }

  return extractedResult;
}

export default extractResult;
