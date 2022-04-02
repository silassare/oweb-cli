/**
 * O'Web CLI
 *
 * Emile Silas SARE (emile.silas@gmail.com)
 */

const path   = require("path"),
      mkdirp = require("mkdirp");

module.exports = function(dest) {
	let dir = path.dirname(dest);
	return mkdirp.sync(dir);
};