const assert = require('assert')
const sha256 = require('sha256')
const fs = require('fs-extra')
const img = require('../model/image_sharp.js')

const test_image = fs.readFileSync("test.jpeg")

describe('resize', function() {
    
    it('resize 100x100', function(done){
        img.resize(test_image, 100, 100, (err, data) => {
            assert.equal(null, err)
            assert.equal("a7b9f480e7e9585ed121e9c1f5a3656277bcf939f64d42243f49c68494c8c90f", sha256(data))
            done()
        })
    })
    
    it('resize 10x20', function(done){
        img.resize(test_image, 10, 20, (err, data) => {
            assert.equal(null, err)
            assert.equal("e5e19c7f995a841510c672a830d0f43f7c3361d9517bc0aeca738df5e0675df4", sha256(data))
            done()
        })
    })
    
    it('resize 200x50', function(done){
        img.resize(test_image, 200, 50, (err, data) => {
            assert.equal(null, err)
            assert.equal("40278c00c18752ebf2327b5e36fc2a6fd607f7d6e4ec67fd36eaaedfcf388fd9", sha256(data))
            done()
        })
    })
    
    it('resize heigh=null', function(done){
        img.resize(test_image, 200, null, (err, data) => {
            done(!err)
        })
    })
    
    it('resize heigh=0', function(done){
        img.resize(test_image, 200, 0, (err, data) => {
            done(!err)
        })
    })
    
    it('resize heigh=1', function(done){
        img.resize(test_image, 200, 1, (err, data) => {
            done(!err)
        })
    })
    
    it('resize width=null', function(done){
        img.resize(test_image, null, 200, (err, data) => {
            done(!err)
        })
    })
    
    it('resize width=0', function(done){
        img.resize(test_image, 0, 200, (err, data) => {
            done(!err)
        })
    })
    
    it('resize width=1', function(done){
        img.resize(test_image, 1, 200, (err, data) => {
            done(!err)
        })
    })
    
    it('resize image=null', function(done){
        img.resize(null, 200, 200, (err, data) => {
            done(!err)
        })
    })
    
    it('resize image=integer', function(done){
        img.resize(100, 200, 200, (err, data) => {
            done(!err)
        })
    })
})
