/* eslint-env node */
const fse	= require("fs-extra");
const path	= require("path");

const gulp	= require("gulp");
const webExt	= require("web-ext").default;
const mergeStream	= require("merge-stream");

const eslint	= require("gulp-eslint");
const jsonEdit	= require("gulp-json-editor");
const pkgJson	= require("./package.json");

const testPrefs	= require("./.extprefrc.js");

/* Building */

const BUILD_DIR 	= "./build/";
const SOURCE_DIR	= "./src/";
const ARCHIVES_DIR	= "./dist/";

gulp.task("clean", () => {
	try {
		fse.emptyDirSync(BUILD_DIR);
	} catch (e) {
		console.error(e);
	}
});

{
	const build = () => {
		return mergeStream(
			gulp.src([`${SOURCE_DIR}**`,`!${SOURCE_DIR}manifest.json`], {dot: true})
				.pipe(gulp.dest(BUILD_DIR)),
			gulp.src(`${SOURCE_DIR}manifest.json`)
				.pipe(jsonEdit({
					version: pkgJson.version
				}))
				.pipe(gulp.dest(BUILD_DIR))
		);
	};
	gulp.task("build-unclean", build);
	gulp.task("build", ["clean"], build);
}

gulp.task("lint", ["build"], () => {
	webExt.cmd.lint({
		sourceDir:	BUILD_DIR
	}, {shouldExitProgram: false});
	return gulp.src(`${BUILD_DIR}**/*.js`)
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task("dist", ["build"], () => {
	webExt.cmd.build({
		sourceDir:	BUILD_DIR,
		artifactsDir:	ARCHIVES_DIR,
		overwriteDest:	true
	}, {shouldExitProgram: false});
});

const parsePrefs = () => {
	const webExtPrefs = {};
	if (testPrefs && testPrefs.firefox_prefs) {
		for (const pref in testPrefs.firefox_prefs) {
			webExtPrefs[pref] = testPrefs.firefox_prefs[pref];
		}
	}
	return webExtPrefs;
};

gulp.task("run", ["build"], () => {
	let {WEB_EXT_FIREFOX: firefox} = process.env;
	if (typeof firefox === "undefined" || firefox === "aurora") {
		firefox = "firefoxdeveloperedition";
	}
	gulp.watch([SOURCE_DIR, `${SOURCE_DIR}**`], ["build-unclean"]);
	return webExt.cmd.run({
		pref:	parsePrefs(),
		firefox: firefox,
		sourceDir:	path.resolve(BUILD_DIR),
		browserConsole: true
	}, {shouldExitProgram: true});
});
