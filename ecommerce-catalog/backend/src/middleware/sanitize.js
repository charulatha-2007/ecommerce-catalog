const xss = require('xss');

/**
 * Recursively strips potentially dangerous HTML/script content from
 * strings in req.body, req.query and req.params. Works alongside
 * express-mongo-sanitize (applied globally in app.js) which strips
 * Mongo operator injection like `{ "$gt": "" }`.
 */
function deepSanitize(value) {
  if (typeof value === 'string') {
    return xss(value.trim(), { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] });
  }
  if (Array.isArray(value)) {
    return value.map(deepSanitize);
  }
  if (value && typeof value === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      clean[key] = deepSanitize(val);
    }
    return clean;
  }
  return value;
}

function sanitizeRequest(req, res, next) {
  if (req.body) req.body = deepSanitize(req.body);
  if (req.query) req.query = deepSanitize(req.query);
  if (req.params) req.params = deepSanitize(req.params);
  next();
}

module.exports = sanitizeRequest;
