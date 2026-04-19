function escapeShell(str) {
  return str.replace(/["\\$`]/g, "\\$&");
}

export default escapeShell;
