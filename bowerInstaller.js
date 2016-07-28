/* eslint indent: 1 */
/**
 * Created by scott on 16-3-9.
 */
'use strict'

const bower = require('bower')
const Promise = require('bluebird')
const semver = require('semver')
const _ = require('lodash')
const logger = require('log4js').getLogger('BowerInstaller')

module.exports = {
	diff: diffBowerInstalledPackages,
	install: installBowerPackages,
	checkAndInstall: checkAndInstall
}

function checkAndInstall(targetDependencies, option) {
	return diffBowerInstalledPackages(targetDependencies, option.cwd)
		.then(function (dependencies) {
			if (_.isEmpty(dependencies)) {
				return Promise.resolve()
			}
			return installBowerPackages(dependencies, option)
		})
		.catch(function (e) {
			logger.error(e.message)
			return e
		})
}

/**
 * install target dependencies with custom config
 *
 * @param {Object} dependencies - dependencies need being installed
 * @param {Object} option - allowed option: cwd, offline, loglevel[error], force
 * @returns {bluebird|Promise.<T>}
 */
function installBowerPackages(dependencies, option = { cwd: '.' }) {
	logger.trace('bower packages to be installed are: ', dependencies)
	logger.trace('and install option is: ', option)

	return new Promise(function (resolve, reject) {
		logger.info('installing bower dependencies...')

		bower.commands.install(createBowerDependenciesArray(dependencies), {
				forceLatest: true
			}, option)
			.on('log', function (log) {
				logger.info(`[${log.id}]`, log.message)
			})
			.on('prompt', function (prompts, callback) {
				logger.info('prompts', prompts)
				callback()
			})
			.on('error', reject)
			.on('end', function (results) {
				logger.debug('installed dependencies are: ', results)
				logger.info('bower installation finished.')
				resolve(results)
			})
	})
}

/**
 * transform the dependency object into array style for npm convention
 *
 * e.g. { "jquery": "~2.1.4" } => ["jquery@~2.1.4"]
 *
 * @param {Object} dependencies
 * @returns {Array}
 */
function createBowerDependenciesArray(dependencies) {
	const result = _.map(dependencies, function (dep, name) {
		if (semver.validRange(dep)) {
			return `${name}#${dep}`
		} else {
			return dep
		}
	})

	logger.trace('bower dependencies array is: \n', result)

	return result
}

/**
 * compare the targetDependencies with installedDependencies,
 * and filter the unmatched dependencies
 *
 * @param {Object} targetDependencies
 * @param {String} [dir]
 * @returns {Promise.<T>}
 */
function diffBowerInstalledPackages(targetDependencies, dir) {
	logger.info('checking bower dependencies...')
	logger.trace('target bower packages are: \n', targetDependencies)
	logger.trace('target installation dir is: ', dir)

	return extractInstalledBowerDependencies(dir)
		.then(function (installedPackages) {
			logger.trace('installed bower packages are: \n', installedPackages)

			return _.omitBy(targetDependencies, function (targetVersion, name) {
				if (installedPackages[name]) {
					if (semver.satisfies(installedPackages[name], targetVersion)) {
						return true
					} else {
						logger.debug(`package ${name} was installed, but doesn't match the target version - ${targetVersion}`)
						return false
					}
				} else {
					logger.debug(`package ${name} isn't installed`)
					return false
				}
			})
		}, function () {
			return targetDependencies
		})
}

/**
 * extract the installed dependencies of target <dir>
 *
 * @param {String} [dir='.']
 * @returns {bluebird|Promise.<T>}
 */

function extractInstalledBowerDependencies(dir) {
	return new Promise(function (resolve, reject) {
		logger.trace('bower listing packages...')
		bower.commands.list(null, {
				cwd: dir || '.',
				offline: true
			})
			.on('log', function (log) {
				logger.debug(`[${log.id}]`, log.message)
			})
			.on('error', reject)
			.on('end', function (results) {
				const dependencies = results.dependencies

				/* transform the installed meta data into plain object
				 * e.g.  BigMetaObject =>  { angular: '1.4.9 }
				 */
				let installedBowerPackages =
					_.reduce(dependencies, function (result, value, key) {
						result[key] = value.pkgMeta.version
						return result
					}, {})

				logger.debug('packages installed before are: \n', installedBowerPackages)

				resolve(installedBowerPackages)
			})
	})
}
