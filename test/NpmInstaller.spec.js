/**
 * Created by scott on 16-3-10.
 */
'use strict'

const expect = require('chai').expect
const Promise = require('bluebird')
const npm = require('npm')
const del = require('del')
const fs = require('fs')
const path = require('path')
const devNull = require('dev-null')
const npmInstaller = require('../npmInstaller')

describe('#Npm installer test', function () {
	before('', function () {
		return Promise.promisify(npm.load)({
			//global: true,
			//prefix: './test-resources',
			color: false,
			loglevel: 'silent',
			progress: false,
			logstream: devNull()
		})
	})

	describe('checker test', function () {

		it('should return the unmatched dependencies $$ assume current npm->3.x and bower->1.7.x $$', function () {

			this.timeout(30000)

			const targetDeps = {
				lodash: '~3.10.1',
				mocha: '^2.4.0'
			}

			return npmInstaller.diff(targetDeps)
				.then(function (checkResult) {
					expect(checkResult).to.be.eql({ lodash: '~3.10.1' })
				})
		})
	})

	describe('installer test', function () {


		const nmPath = './node_modules/'

		it('should install the null package `null`', function () {
			this.timeout(60000)

			const targetDeps = {
				'null': 'latest'
			}

			return npmInstaller.install(targetDeps)
				.then(function () {
					const exist = fs.existsSync(path.join(nmPath, 'null'))
					expect(exist).to.be.equal(true)
				})
		})

		after('delete the temporarily installed package', function () {
			return del(path.join(nmPath, 'null'))
		})
	})


})
