const nosql = require('nosql')
const sha256 = require('sha256')
const fs = require('fs')
const rimraf = require("rimraf")
const path = require('path')

//
// db - instance of nosql database
// cache - path to folder with images
//
// Note: the images are stored in a fs, not in the DB
// I'm not sure it is ok to save big image files to DB 
//
var db = undefined
var cache = undefined

//
// it is a name of an original image in FS cache
//
const default_image_name = "image.jpg"

var getUserFolder = function(user_id, image_id) {
    //
    // returns user's cache folder 
    // 
    return path.join(cache, user_id)
}

var getImageFolder = function(user_id, image_id) {
    //
    // returns user's cache folder for an image
    // 
    return path.join(getUserFolder(user_id), image_id)
}

var imageWriteToFileSync = function(user_id, image) {
    
    image_id = sha256(image)
    image_folder = getImageFolder(user_id, image_id)
    image_path = path.join(image_folder, default_image_name)
    
    console.log("imageWriteToFileSync:",
        "user_id=", user_id, 
        "image_id=", image_id, 
        "image_path=", image_path)
    
    if (fs.existsSync(image_folder)) {
        throw new Error("Image already exisits [" + image_folder + "]")
    }
    
    //fs.mkdirSync(image_folder)
    fs.mkdirSync(image_folder, { recursive: true })
    fs.writeFileSync(image_path, image)
    return image_id
}

var imageReadFromFileSync = function(user_id, image_id) {
    
    console.log("imageReadFromFileSync:",
        "user_id=", user_id, 
        "image_id=", image_id)
        
    image_folder = getImageFolder(user_id, image_id)
    image_path = path.join(image_folder, default_image_name)
    return fs.readFileSync(image_path)
}

module.exports = {
    init: function (db_file_path, db_files_cache_path) {
        db = nosql.load(db_file_path)
        cache = db_files_cache_path
    },
    addImage: function (user_id, image) {
        
        image_id = sha256(image)
        timestamp = new Date().toISOString()
        console.log("addImage: ", user_id, image_id)

        imageWriteToFileSync(user_id, image)
       
        
        db.update({ 
            user_id: user_id, 
            image_id: image_id,
            timestamp: timestamp 
        }).callback(function(err, count) {
            if (err) {
                // TODO: remove the image in FS
                console.log('addImage db error', err,  doc)
            } else if (0 === count) {
                // FIX: how to update or insert ?
                db.insert({ 
                    user_id: user_id, 
                    image_id: image_id,
                    timestamp: timestamp
                }).callback(function(err, count) {
                    if (err) {
                        // TODO: remove the image in FS
                        console.log('addImage db error', err,  doc)
                    }                   
                })
            }
        })
        
        return image_id
    },
    removeImage: function (user_id, image_id) {
        
        //
        // it is ok to remove in async mode, 
        // in case of an error just write to log file 
        //
        
        console.log("removeImage: ", user_id, image_id)
        rimraf(getImageFolder(user_id, image_id), function(err) {
            console.log('removeImage folder error: ', error)
        })

        db.remove().make(function(filter) {
            filter.where('user_id', user_id)
            filter.where('image_id', image_id)
            filter.callback(function(err, count) {
                if (err) {
                    console.log('removeImage db error:', err)
                }
            })
        })
    },
    getImage: function (user_id, image_id) {
        console.log("getImage: ", user_id, image_id)
        return imageReadFromFileSync(user_id, image_id)
    },
    getImageList: function (user_id, callback) {
        //
        // TODO: it should return list by ragne, 
        // like from 0 to 100, from 101 to 200 etc
        //
        console.log("getImageList: ", user_id)
        var response = db.find().make(function(filter) {
            filter.where('user_id', user_id)
            filter.callback(callback)
        })
    },
    
    removeUser: function (user_id) {
        
        //
        // it is ok to remove in async mode, 
        // in case of an error just write to log file 
        //
        
        console.log("removeUser: ", user_id)
        rimraf(getUserFolder(user_id), function(err) {
            console.log('removeUser folder error: ', err)
        })

        db.remove().make(function(filter) {
            filter.where('user_id', user_id)
            filter.callback(function(err, count) {
                if (err) {
                    console.log('removeUser db error:', err, "user_id:", user_id)
                }
            })
        })
    },
}

