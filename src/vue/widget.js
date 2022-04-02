/**
 * O'Web CLI
 *
 * Emile Silas SARE (emile.silas@gmail.com)
 */

const fs     = require("fs"),
      path   = require("path"),
      mkdest = require("../mkdest"),
      root   = path.resolve(process.cwd(), "./src");

module.exports = {
	run: function(cli) {

		const name = cli.getArg("name");

		if (!name || !name.length) {
			console.log(`invalid widget name, ex: my-widget or sub/dir/my-widget`);
			return;
		}

		const componentName       = name.split("/").pop(),
		      fileName            = name.replace(/-/g, "."),
		      componentFile       = path.resolve(root, "./components/" + fileName + ".ts");

		if (fs.existsSync(componentFile)) {
			console.warn(`exists: ${componentFile}`);
			return;
		}

		const componentContent              = `<template>
	<div>component: ${componentName}</div>
</template>

<script lang="ts">
	import BaseComponent from "@/BaseComponent";

	export default BaseComponent.extend({
		name : "${componentName}"
	});
</script>

<style lang="less"></style>
`;

		Promise.all([mkdest(componentFile)])
		       .then(function() {
			       fs.writeFileSync(componentFile, componentContent);

			       console.log(`component added: ${componentName}`);
		       });
	}
};
