function env(key, defaultValue = undefined) {
  return process.env[key] || defaultValue;
}

export default env;
