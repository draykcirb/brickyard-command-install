/**
 * Created by scott on 16-3-11.
 */
'use strict'

const expect = require('chai').expect
const del = require('del')
const fs = require('fs')
const path = require('path')
const bowerInstaller = require('../bowerInstaller')

describe('#Bower installer test', function () {
	const targetPath = './test-resources/'

	before('delete the temporarily installed package', function () {
		return del(targetPath + 'bower_components')
	})

	after('delete the temporarily installed package', function () {
		return del(targetPath + 'bower_components')
	})

	describe('installer test', function () {

		it('should install the package `underscore`', function () {
			this.timeout(60000)

			const targetDeps = {
				underscore: '~1.8.3',
				'hint.css': '2.2.0'
			}

			return bowerInstaller.install(targetDeps, {
					cwd: targetPath,
					loglevel: 'error'
				})
				.then(function () {
					const exist = fs.existsSync(path.join(targetPath, 'bower_components', 'underscore'))
					expect(exist).to.be.equal(true)
				})
		})
	})

	describe('checker test', function () {

		it('should return the unmatched dependencies', function () {

			this.timeout(30000)

			const targetDeps = {
				underscore: '1.7.x',
				'hint.css': '^2.0.0'
			}

			return bowerInstaller.diff(targetDeps, targetPath)
				.then(function (checkResult) {
					expect(checkResult).to.be.eql({ underscore: '1.7.x' })
				})
		})
	})

})
