/*
 * Copyright (C) 2017 ExE Boss
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import "./types.js";

/**
 * Gets the default theme for the current browser.
 *
 * @return	{string}	The default theme for the current browser.
 */
export const getDefaultTheme = async () => {
	const browserInfo = await browser.runtime.getBrowserInfo();
	if (browserInfo.name === "Firefox") {
		if (browserInfo.version.localeCompare("29", [], {numeric: true}) < 0) {
			return "classic";
		} else if (browserInfo.version.localeCompare("57", [], {numeric: true}) < 0) {
			return "australis";
		} else {
			return "photon";
		}
	} else {
		return "pastel-svg";
	}
};

/**
 * Gets the currently used theme.
 *
 * @param	{boolean}	[useFetch=true]	If the function should also fetch the theme configuration.
 * @return	{Theme}	The currently used theme.
 */
export const getCurrentTheme = async (useFetch=true) => {
	let {theme: themeDir} = await browser.storage.sync.get({
		theme: "default"
	});

	if (themeDir === "default") {
		themeDir = await getDefaultTheme();
	}

	/** @type {Theme} */
	const result = {
		themeDir,
		themeCSS: `/themes/${themeDir}/theme.css`
	};

	if (useFetch) {
		result.themeJSON = await fetch(`/themes/${themeDir}/theme.json`)
			.then(r => r.json())
			.then(data => {
				return Object.assign({
					default_extension: "svg",
					browser_action: "firefox",
				}, data);
			})
			.catch(e => {
				console.warn(e);
				return undefined;
			});
	}

	return result;
};

/**
 * @param	{string}	string	The string.
 * @param	{string}	prefix	The translation prefix.
 * @return	{string}	The translated string.
 */
export const processMessage = (string, prefix) => {
	let [,key] = (/^__MSG_([A-Za-z0-9_@]+)__$/.exec(string) || []);
	if (isString(key)) {
		key = isString(prefix) ? `${prefix}_${key}` : key;
		string = `__MSG_${key}__`;
	}
	return isString(key) ? browser.i18n.getMessage(key) || string : string;
};

/**
 * Check if the argument is a string.
 *
 * @param	{string}	string	The variable to check if it is a String.
 * @return	{boolean}	If the string argument is a string.
 */
export const isString = string => {
	return (typeof string === "string" || string instanceof String);
};
