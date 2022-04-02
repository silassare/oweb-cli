/**
 * O'Web CLI
 *
 * Emile Silas SARE (emile.silas@gmail.com)
 */

const fs = require("fs"),
	path = require("path"),
	mkdest = require("../mkdest"),
	OTpl = require("otpl-js"),
	root = path.resolve(process.cwd(), "./src");

module.exports = {
	run: function (cli) {

		const componentsDir = path.resolve(root, "components"),
			destFile = path.resolve(root, "./oweb.components.ts"),
			components = [],
			extReg = /\.[a-z]{2,}$/,
			template = cli.getAssetContent(cli.getArg("l") ? "bundle.components.lazy.otpl" : "bundle.components.otpl"),
			registerComponents = function (dir, root) {
				let list = fs.readdirSync(dir);
				list.forEach(function (fileName) {
					let src = path.resolve(dir, fileName);
					if (extReg.test(fileName) && fs.lstatSync(src).isFile()) {
						let baseFileName = fileName.replace(extReg, "");
						if (baseFileName !== "base") {

							components.push({
								"dir": path.relative(root,
									path.dirname(src)),
								"class": baseFileName.replace(
									/\.([a-z0-9])/g,
									function (a, c) {
										return c.toUpperCase();
									}).replace(/^([a-z0-9])/g,
										function (a, c) {
											return c.toUpperCase();
										}),
								"baseFileName": baseFileName,
								"isPage": baseFileName[0].toUpperCase() === "P",
								"componentName": baseFileName
									.replace(/\./g, "-")// my.component => my-component
									// WComponentBase => w-component-base
									.replace(/^([A-Z])([A-Z])([a-z])/, "$1-$2$3")
									.replace(/([a-z])([A-Z])/g, "$1-$2")
									.toLowerCase()
							});
						}
					} else if (fs.lstatSync(src).isDirectory()) {
						registerComponents(src, root);
					}
				});
			};

		mkdest(componentsDir);
		(function () {
			registerComponents(componentsDir, root);

			let o = new OTpl;
			let content = o.parse(template).runWith({
				components,
				"oweb_version": cli.OWEB_VERSION,
				"bundle_date": (new Date).toGMTString()
			});

			fs.writeFileSync(destFile, content);

			console.log(
				`oweb: ${ components.length } component(s) registered.`);
		})();
	}
};
