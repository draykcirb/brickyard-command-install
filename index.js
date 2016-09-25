/**
 * Created by scott on 16-3-29.
 */
/* eslint import/no-unresolved:0 */
'use strict'

const Promise = require('bluebird')
const _ = require('lodash')

const logger = require('log4js').getLogger('install-command')
const butil = require('brickyard3/lib/util')
const npmInstaller = require('./npmInstaller')
const bowerInstaller = require('./bowerInstaller')

module.exports = {
    register,
    run,
    config: {
        offline: false,
        registry: null
    }
}

/**
 * register the command
 *
 * @param {Command} cmd
 * @param {function(Object)} optionsCallback
 */
function register(cmd, optionsCallback) {
    return cmd
        .alias('i')
        .description('install all dependencies of target program')
        .arguments('<program...>')
        .usage('<program...> [options]')
        .option('--registry <reg>', 'npm registry')
        .option('--offline', 'bower offline installation')
        .option('--no-dev', 'do not install any devDependency')
        .option('--dest-prefix <prefix>', 'output dir prefix for install bower dependencies')
        // .option('--save', 'save the dependencies to the root package')
        .action(function (program) {
            optionsCallback(Object.assign({ program: program }, this.opts()))
        })
}

function run(runtime) {
    logger.trace('install command running')

    const npmDeps = getDependencies(butil.filterDeep(runtime.plugins, 'raw'), runtime.config.dev)
    const bowerDeps = getDependencies(butil.filterDeep(runtime.plugins, 'bower'), runtime.config.dev)

    const npmInstallConfig = {}

    if (runtime.config.registry) {
        npmInstallConfig.registry = runtime.config.registry
    }

    return Promise.reduce(
        [
            function () {
                return npmInstaller.checkAndInstall(npmDeps, npmInstallConfig)
            },
            function () {
                return bowerInstaller.checkAndInstall(bowerDeps, {
                    cwd: runtime.config.dest,
                    loglevel: 'action',
                    // quiet: true,
                    offline: runtime.config.offline
                })
            }
        ],
        function (input, task) {
            return task()
        }, 0)
        .then(function () {
            logger.info('Installation finished')
        })
        .catch(function (e) {
            logger.error('Installation failed')
            throw e
        })
}

/**
 * extract the dependencies property of the input
 * as well as devDependencies if dev is true
 *
 * @param packages
 * @param dev
 * @returns {{}|*}
 */
function getDependencies(packages, dev) {
    return packages.reduce(function (result, obj) {
        _.assignIn(result, obj.dependencies, dev ? obj.devDependencies : {})

        return result
    }, {})
}
