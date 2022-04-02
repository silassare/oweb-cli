/**
 * O'Web CLI
 *
 * Emile Silas SARE (emile.silas@gmail.com)
 */

const fs   = require("fs"),
      path = require("path"),
      OTpl = require("otpl-js");

let cleanFileContent = function(content) {
	return content.toString()
	              .replace(/"/g, "\\\"")
	              .replace(/\t/g, "\\t")
	              .replace(/\n/g, "\\n")
	              .replace(/\r/g, "\\r");
};

let getWebSrc = function(root, src) {
	return src.replace(root, "")
	          .replace(/\\/g, "/").replace(/^\//, "");
};

// walk into directory and search for file with given extension
// make a bundle as output
let dirTemplateBundle = function(dir, web_root, to, compile) {
	let tplCount = 0,
	    list     = fs.readdirSync(dir);

	list.forEach(function(name) {
		let src = path.resolve(dir, name);

		if (fs.lstatSync(src).isDirectory()) {
			tplCount += dirTemplateBundle(src, web_root, to, compile);
		} else if (fs.lstatSync(src).isFile()) {
			let src_web = getWebSrc(web_root, src),
			    content = fs.readFileSync(src);

			if (compile) {
				let compiler = require("vue-template-compiler");
				content      = compiler.compile("" + content).render;
			}

			to[src_web] = cleanFileContent(content);
			tplCount++;
		}
	});

	return tplCount;
};

module.exports = {
	run: function(cli) {

		const rootDir = process.cwd(),
		      srcDir  = path.resolve(rootDir, "src/templates"),
		      destDir = path.resolve(rootDir, "src"),
		      compile = cli.getArg("c") || false,
		      isTs    = cli.getArg("ts") || false,
		      ext     = isTs ? "ts" : "js";

		let counter  = 0,
		    filesMap = {};

		if (fs.existsSync(srcDir) && fs.lstatSync(srcDir).isDirectory()) {

			const bundleName = "oweb.templates." + ext,
			      outputTpl  = cli.getAssetContent(`bundle.tpl.${ext}.otpl`);

			counter = dirTemplateBundle(srcDir, srcDir, filesMap, compile);

			if (counter) {
				let o      = new OTpl;
				let result = o.parse(outputTpl).runWith({
					"files"       : filesMap,
					"compiled"    : compile,
					"oweb_version": cli.OWEB_VERSION,
					"bundle_date" : (new Date).toGMTString()
				});

				fs.writeFileSync(path.resolve(destDir, bundleName), result);
			}
		}

		if (counter) {
			console.log("oweb: %d template(s) bundled.", counter);
		} else {
			console.log("oweb: there is no template to bundle.");
		}
	}
};