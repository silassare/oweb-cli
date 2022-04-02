/**
 * O'Web CLI
 *
 * Emile Silas SARE (emile.silas@gmail.com)
 */

const fs         = require("fs"),
      path       = require("path"),
	  TASK_INDEX    = 2,
      switchExists  = function(name) {
	      return ~process.argv.indexOf(name);
      },
      getArg     = function(name) {

      	  name = (name.length === 1 ? "-" : "--") + name;

	      let argv  = process.argv;
	      let found = false,
	          i     = TASK_INDEX + 1,
	          reg   = new RegExp("^" + name + "="),
	          current;

	      while (!found && i < argv.length) {
		      current = argv[i];
		      found   = (reg.test(current) || current === name);
		      i++;
	      }

	      if (found) {
		      return current === name ? true : current.slice(name.length + 1);
	      }

	      return undefined;
      },
      printUsage = function(err_message) {
	      console.log(
		      `
O'Web is a framework for web applications that use APIs built with the OZone framework.
`
	      );

	      if (err_message) {
		      console.error(err_message);
	      }

	      process.exit(0);
      };

const OWebCli = {
	getTask        : function() {
		return process.argv[TASK_INDEX];
	},
	getAssetContent: function(file) {
		return fs.readFileSync(path.resolve(__dirname, `../assets/${file}`));
	},
	getArg         : function(name) {
		return getArg(name);
	}
};

OWebCli.OWEB_VERSION = "1.0.0";

if (switchExists("-h") || switchExists("--help")) {
	return printUsage();
}

let taskList  = {
	    "bundle-tpl"       : "./template/bundle.js",
	    "bundle-components": "./vue/bundle-components.js",
	    "widget"           : "./vue/widget.js",
	    "page"             : "./vue/page.js",
	    "rename"           : "./utils/rename.js",
	    "convert"          : "./template/convert.js"
    },
    taskName  = OWebCli.getTask();

if (!(taskName in taskList)) {
	let usage = "Usage:", o;

	for (o in taskList) {
		usage += `\n\toweb ${o} [...arg]`;
	}

	return printUsage(usage);
}

require(taskList[taskName]).run(OWebCli);