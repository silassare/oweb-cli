/**
 * O'Web CLI
 *
 * Emile Silas SARE (emile.silas@gmail.com)
 */

const fs     = require("fs"),
	  path   = require("path"),
	  mkdest = require("../mkdest"),
	  OTpl   = require("otpl-js");

let dirComponentsMap = function (dir, templatesDir, subDir) {
	let list = fs.readdirSync(dir),
		to   = [];

	subDir = subDir || [];

	list.forEach(function (name) {
		let src = path.resolve(dir, name);

		if (fs.lstatSync(src).isDirectory()) {
			to.push(...dirComponentsMap(src, templatesDir, [...subDir, name]));
		} else if (fs.lstatSync(src).isFile()) {
			let fileName           = name.replace(/\.ts$/, ""),
				componentNameDot   = fileName.replace(/([A-Z])/g,
					function (a, c) {
						return "." + c.toLowerCase();
					}).replace(/^\./g, ""),
				componentNameCamel = fileName.replace(/\.([a-z0-9])/g,
					function (a, c) {
						return c.toUpperCase();
					}).replace(/^([a-z0-9])/g,
					function (a, c) {
						return c.toUpperCase();
					}),
				_sd                = subDir.length
									 ? subDir.join("/") + "/"
									 : "",
				templateSrc        = path.resolve(templatesDir,
					_sd + componentNameDot + ".html");

			to.push({
				name,
				dir,
				src,
				lang     : "ts",
				scriptSrc: src,
				templateSrc,
				componentNameDot,
				componentNameCamel
			});
		}
	});

	return to;
};

module.exports = {
	run: function (cli) {

		const srcDir            = path.resolve(process.cwd(), "src"),
			  destDir           = path.resolve(cli.getArg("d"), "src"),
			  srcComponentsDir  = path.resolve(srcDir, "components"),
			  srcPagesDir       = path.resolve(srcDir, "pages"),
			  srcTemplatesDir   = path.resolve(srcDir, "templates"),
			  componentsDirList = [srcComponentsDir, srcPagesDir];

		let filesMap  = [],
			logs      = {
				done           : [],
				missingTemplate: [],
				duplicate      : []
			},
			outputTpl = cli.getAssetContent("component.ts.vue.txt"),
			o         = new OTpl;

		o.parse(outputTpl);

		componentsDirList.forEach(function (d) {
			filesMap.push(...dirComponentsMap(d, srcTemplatesDir));
		});

		filesMap.forEach(function (item) {
			let script   = fs.readFileSync(item.scriptSrc).toString(),
				template = "";

			if (fs.existsSync(item.templateSrc) &&
				fs.lstatSync(item.templateSrc).isFile()) {
				template = fs.readFileSync(item.templateSrc).toString();
			}
			if (template.length) {
				let reg1          = /name\s+:\s+[^\n]+\s+template:\s+[^\n]+/,
					reg2          = /import\s+\{templateLoad\}[^\n]+\n/,
					reg3          = /import\s+BaseComponent[^\n]+/,
					reg4          = /import\s+app\s+from[^\n]+/,
					reg5          = /import\s+WField\s+from[^\n]+/,
					reg6          = /\.\.\/gobl\.bundle/,
					componentPath = item.dir.replace(srcDir, destDir);

				script          = script
					.replace(reg1, `name : "${item.componentNameCamel}",`)
					.replace(reg2, "")
					.replace(reg3, "import BaseComponent from \"@/components/BaseComponent.vue\";")
					.replace(reg4, "import app from \"@/app\";")
					.replace(reg5, "import WField from \"@/components/form/WField.vue\";")
					.replace(reg6, "@/gobl.bundle");

				componentPath = path.resolve(componentPath,
					item.componentNameCamel + ".vue");

				mkdest(componentPath);

				if (!fs.existsSync(componentPath)) {
					fs.writeFileSync(componentPath, o.runWith({
						template,
						script,
						componentPath,
						...item
					}));
					logs.done.push(item);
				} else {
					logs.duplicate.push(item);
				}
			} else {
				logs.missingTemplate.push(item);
			}
		});

		console.log("oweb: %d component(s) converted.", filesMap.length);
		console.log("oweb: %d missing template(s).",
			logs.missingTemplate.length);
		console.log("oweb: %d duplicate(s) found.",
			logs.duplicate.length);

		let logPath = path.resolve(destDir, "./log.json");

		mkdest(logPath);

		fs.writeFileSync(logPath, JSON.stringify(logs));
	}
};