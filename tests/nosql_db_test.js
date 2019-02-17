const assert = require('assert')
const fs = require('fs-extra')
const path = require('path')
const sha256 = require('sha256')
const db = require('../model/nosql_db.js')

const db_files_cache_path = "nosql_db_test.tmp"
const db_file_path = path.join(db_files_cache_path, "db.txt")

// test data
const test_image_1 = fs.readFileSync("test.jpeg")
const test_image_1_hash = sha256(test_image_1)
const test_image_2 = fs.readFileSync("test2.jpg")
const test_image_2_hash = sha256(test_image_2)
const user_id_1 = "1"
const user_id_2 = "2"

beforeEach(function() {
    db.init(db_file_path, db_files_cache_path)
})

afterEach(function() {
    fs.removeSync(db_files_cache_path)
})

describe('addImage', function() {
    
    it('add normal', function(done){
        // just add an image, it should work ok
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            done()
        })
    })
    
    it('add duplicated image', function(done){
        // add an image, it should be done ok
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            // add the same image, it should be failed
            db.addImage(user_id_1, test_image_1, (err, image_id) => {
                done(!err)
            })
        })
    })
    
    it('add the same image but not users', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            db.addImage(user_id_2, test_image_1, (err, image_id) => {
                if (err) return done(err)
                assert.equal(test_image_1_hash, image_id)
                done()
            })
        })
    })
})

describe('removeImage', function() {
    
    it('remove normal', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            // remove the just added image
            db.removeImage(user_id_1, image_id, err => {
                done(err)
            })
        })
    })
    
    it('remove unknown image id', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            var wrong_id = image_id + "_"
            // remove an image with unkonwn id
            // user id is valid
            db.removeImage(user_id_1, wrong_id, err => {
                done(!err)
            })
        })
    })
    
    it('remove unknown used id', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            // remove an image with valid image id
            // but unknown user id
            db.removeImage(user_id_2, image_id, err => {
                done(!err)
            })
        })
    })
})

describe('getImage', function() {
    
    it('get single normal', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            // get the image
            db.getImage(user_id_1, image_id, (err, image_data) => {
                if (err) return done(err)
                assert.equal(test_image_1_hash, sha256(image_data))
                done(err)
            })
        })
    })
    
    it('get multi normal', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id_1) => {
            if (err) return done(err)
            // add one more image
            db.addImage(user_id_2, test_image_2, (err, image_id_2) => {
                if (err) return done(err)

                // get first
                db.getImage(user_id_1, image_id_1, (err, image_data_1) => {
                    if (err) return done(err)
                    assert.equal(test_image_1_hash, sha256(image_data_1))
                    
                    // get second    
                    db.getImage(user_id_2, image_id_2, (err, image_data_2) => {
                        if (err) return done(err)
                        assert.equal(test_image_2_hash, sha256(image_data_2))
                        done(err)
                    })
                })
            })
        })
    })
    
    it('get unknown image', function(done){
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            // get the image
            var wrong_id = image_id + "_"
            db.getImage(user_id_1, image_id, (err, image_data) => {
                done(err)
            })
        })
    })
    
    it('get unknown user id', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            // get the image
            db.getImage(user_id_2, image_id, (err, image_data) => {
                done(!err)
            })
        })
    })
})

describe('getImageList', function() {
    
    it('get empty list', function(done){
        db.getImageList(user_id_1, (err, image_list) => {
            if (err) return done(err)
            assert.equal(0, image_list.length)
            done(err)
        })
    })
    
    it('get 1 in list', function(done){
        db.addImage(user_id_1, test_image_1, (err, image_id_1) => {
            if (err) return done(err)
            db.getImageList(user_id_1, (err, image_list) => {
                if (err) return done(err)
                assert.equal(1, image_list.length)
                assert.equal(image_id_1, image_list[0].image_id)
                done(err)
            })
        })
    })
    
    it('get 2 in list', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id_1) => {
            if (err) return done(err)
            // add one more image
            db.addImage(user_id_1, test_image_2, (err, image_id_2) => {
                if (err) return done(err)
                db.getImageList(user_id_1, (err, image_list) => {
                    if (err) return done(err)
                    assert.equal(2, image_list.length)
                    done(err)
                })
            })
        })
    })
    
    it('get 2 in list and diff users', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id_1) => {
            if (err) return done(err)
            // add one more image
            db.addImage(user_id_2, test_image_2, (err, image_id_2) => {
                if (err) return done(err)
                db.getImageList(user_id_1, (err, image_list) => {
                    if (err) return done(err)
                    assert.equal(1, image_list.length)
                    db.getImageList(user_id_2, (err, image_list) => {
                        if (err) return done(err)
                        assert.equal(1, image_list.length)
                        done(err)
                    })
                })
            })
        })
    })
})

describe('removeUserData', function() {
    
    it('remove unknown user', function(done){
        db.removeUserData(user_id_1, (err) => {
            done(err)
        })
    })
    
    it('remove user data', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id_1) => {
            if (err) return done(err)
            // add one more image
            db.addImage(user_id_1, test_image_2, (err, image_id_2) => {
                if (err) return done(err)
                // remove user id
                db.removeUserData(user_id_1, (err) => {
                    if (err) return done(err)
                    // check no more user data   
                    db.getImageList(user_id_1, (err, image_list) => {
                        assert.equal(0, image_list.length)
                        done(err)
                    })
                })
            })
        })
    })
})

describe('addSubImage', function() {
    
    it('add normal', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            // add subimage
            var meta = {}
            db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id) => {
                if (err) return done(err)
                assert.equal(test_image_2_hash, subimage_id)
                done(err)
            })
        })
    })
    
    it('add duplicate', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            // add subimage
            var meta = {}
            db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id) => {
                if (err) return done(err)
                assert.equal(test_image_2_hash, subimage_id)
                // add the same subimage again
                db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id) => {
                    done(!err)
                })
            })
        })
    })
    
    it('add the same image but diff users', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
        
            db.addImage(user_id_2, test_image_1, (err, image_id) => {
                if (err) return done(err)
                assert.equal(test_image_1_hash, image_id)
                // add subimage for user 1
                var meta = {}
                db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id) => {
                    if (err) return done(err)
                    assert.equal(test_image_2_hash, subimage_id)
                    // add the same subimage for user 2
                    db.addSubImage(user_id_2, image_id, test_image_2, meta, (err, subimage_id) => {
                        if (err) return done(err)
                        assert.equal(test_image_2_hash, subimage_id)
                        done(err)
                    })
                })
            })
        })
    })
})

describe('removeSubImage', function() {
    
    it('remove unknown user id', function(done){
        db.removeSubImage(user_id_1, test_image_1_hash, test_image_1_hash, err => {
            done(!err)
        })
    })
    
    it('remove unknown image id ', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            // add subimage
            var meta = {}
            db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id) => {
                if (err) return done(err)
                assert.equal(test_image_2_hash, subimage_id)
                // remove unknown image id
                db.removeSubImage(user_id_1, test_image_2_hash, subimage_id, err => {
                    done(!err)
                })
            })
        })
    })
    
    it('remove unknown subimage id ', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            // add subimage
            var meta = {}
            db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id) => {
                if (err) return done(err)
                assert.equal(test_image_2_hash, subimage_id)
                // remove unknown image id
                db.removeSubImage(user_id_1, test_image_1_hash, subimage_id + "11", err => {
                    done(!err)
                })
            })
        })
    })
    
    it('remove normal', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            // add subimage
            var meta = {}
            db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id) => {
                if (err) return done(err)
                assert.equal(test_image_2_hash, subimage_id)
                // remove unknown image id
                db.removeSubImage(user_id_1, test_image_1_hash, subimage_id, err => {
                    // try to find removed image
                    db.getSubImage(user_id_1, test_image_1_hash, subimage_id, (err, image_data) => {
                        done(!err)
                    })
                })
            })
        })
    })
})

describe('getSubImage', function() {
    
    it('get unknown user id', function(done){
        db.getSubImage(user_id_1, test_image_1_hash, test_image_2_hash, (err, image_data) => {
            done(!err)
        })
    })
    
    it('get unknown subimage id ', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            // get subimage
            db.getSubImage(user_id_1, test_image_1_hash, test_image_2_hash, (err, image_data) => {
                done(!err)
            })
        })
    })
    
    it('get normal ', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            // add subimage
            var meta = {}
            db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id) => {
                if (err) return done(err)
                assert.equal(test_image_2_hash, subimage_id)
                // get subimage
                db.getSubImage(user_id_1, image_id, subimage_id, (err, image_data) => {
                    if (err) return done(err)
                    assert.equal(test_image_2_hash, sha256(image_data))
                    done(err)
                })
            })
        })
    })
    
    it('get milti normal ', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            // add subimage
            var meta = {}
            db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id2) => {
                if (err) return done(err)
                assert.equal(test_image_2_hash, subimage_id2)
                // add subimage 2
                db.addSubImage(user_id_1, image_id, test_image_1, meta, (err, subimage_id1) => {
                    if (err) return done(err)
                    assert.equal(test_image_1_hash, subimage_id1)
                    // get subimage 1
                    db.getSubImage(user_id_1, image_id, subimage_id1, (err, image_data) => {
                        if (err) return done(err)
                        assert.equal(test_image_1_hash, sha256(image_data))
                        // get subimage 2
                        db.getSubImage(user_id_1, image_id, subimage_id2, (err, image_data) => {
                            if (err) return done(err)
                            assert.equal(test_image_2_hash, sha256(image_data))
                            done(err)
                        })
                    })
                })
            })
        })
    })
})

describe('getSubImageList', function() {
    
    it('get empty list', function(done){
        db.getSubImageList(user_id_1, test_image_1_hash, (err, image_list) => {
            if (err) return done(err)
            assert.equal(0, image_list.length)
            done(err)
        })
    })
    
    it('get 1 in list', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            // add subimage
            var meta = {"a": 2, "b": "bbb"}
            db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id) => {
                if (err) return done(err)
                assert.equal(test_image_2_hash, subimage_id)
                // get subimage list
                db.getSubImageList(user_id_1, test_image_1_hash, (err, image_list) => {
                    if (err) return done(err)
                    assert.equal(1, image_list.length)
                    assert.equal(meta.a, image_list[0].meta.a)
                    assert.equal(meta.b, image_list[0].meta.b)
                    done(err)
                })
            })
        })
    })
    
    it('get 2 in list', function(done){
        // add an image
        db.addImage(user_id_1, test_image_1, (err, image_id) => {
            if (err) return done(err)
            assert.equal(test_image_1_hash, image_id)
            // add subimage
            var meta = {}
            db.addSubImage(user_id_1, image_id, test_image_2, meta, (err, subimage_id2) => {
                if (err) return done(err)
                assert.equal(test_image_2_hash, subimage_id2)
                // add subimage 2
                db.addSubImage(user_id_1, image_id, test_image_1, meta, (err, subimage_id1) => {
                    if (err) return done(err)
                    assert.equal(test_image_1_hash, subimage_id1)
                    // get subimage list
                    db.getSubImageList(user_id_1, test_image_1_hash, (err, image_list) => {
                        if (err) return done(err)
                        assert.equal(2, image_list.length)
                        done(err)
                    })
                })
            })
        })
    })
})
