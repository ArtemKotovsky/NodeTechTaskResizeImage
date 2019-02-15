const nosql = require('nosql')
const sha256 = require('sha256')
const fs = require('fs')
const rimraf = require("rimraf")
const path = require('path')
const assert = require('assert').strict;
const uuid = require('uuid/v1');

/*
  DB INTERFACE 
    
    init(db_file_path, db_files_cache_path)
    addImage(user_id, image, callback)
    removeImage(user_id, image_id, callback)
    getImage(user_id, image_id, callback)
    getImageList(user_id, callback)
    removeUserData(user_id, callback)
    addSubImage(user_id, image_id, subimage, callback)
    removeSubImage(user_id, image_id, subimage_id, callback)
    getSubImage(user_id, image_id, subimage_id, callback)
    getSubImageList(user_id, image_id, callback)
    
    user_id is not a part of this DB:
        1. it is just a ID of images' group
        2. I think it shouldn't be here
        3. it is more simple for this task :)
*/

//
// db - instance of nosql database
// cache - path to folder with images
//
// Note: the images are stored in a fs, not in the DB
// I'm not sure it is ok to save big image files to DB 
//
var db = undefined
var cache = undefined

var getUserFolder = function(user_id) {
    // returns user's cache folder 
    return path.join(cache, user_id)
}

var getImageFolder = function(user_id, image_id) {
    // returns user's cache folder for an image
    return path.join(getUserFolder(user_id), image_id)
}

var getImageId = function(user_id, image) {
    // returns user's unique image id
    return sha256(image)
}

var getImagePath = function(user_id, image_id, image_name) {
    // returns image path for image id
    folder = getImageFolder(user_id, image_id)
    return path.join(folder, image_name)
}

var imageWriteToFile = function(image_path, image, callback) {
    // callback(err, image_id)
    
    console.log("imageWriteToFile:",
        "image_path=", image_path)
        
    fs.writeFile(image_path, image, (err) => {
        if (err) callback(err)
        else callback(null, image_id)
    });
}

var imageReadFromFile = function(image_path, callback) {
    // callback(err, image_data)
    
    console.log("imageReadFromFile:",
        "image_path=", image_path)
    
    // readFile uses the same callback prototype
    fs.readFile(image_path, callback)
}

var dbInsertOrUndate = function(db_info, callback) {
    // callback(err)
    
    // either update existing record
    // or create new one
    db.update(db_info).callback(function(err, count) {
        if (err) {
            callback(err)
        } else if (0 === count) {
            // cannot update, there are no such records
            // insert it
            db.insert(db_info).callback(function(err, count) {
                callback(err)                  
            })
        } else {
            assert.ok(1 === count)
            callback(null) 
        }
    })
}

var dbFindCallback = function(err, responce, callback) {
    // callback(err, image_info)
    
    if (err) {
        callback(err)
        return
    }
    console.log(responce)
    if (responce.lenght == 0){
        callback(new Error("Cannot find image with id=" + image_id))
        return
    }
    if (responce.lenght > 1){
        callback(new Error("Found " + responce.lenght + " images with id=" + image_id))
        return
    }
    callback(err, responce[0])
}

var dbFindFilter = function(user_id, image_id, subimage_id, filter) {
    filter.where('user_id', user_id)
    filter.where('image_id', image_id)
    if (subimage_id !== undefined) {
        filter.where('subimage_id', subimage_id)
        filter.where('origin', false)
    } else {
        filter.where('origin', true)
    }
}

var dbFindImage = function(user_id, image_id, subimage_id, callback) {
    // callback(err, image_info)
    
    db.find().make(function(filter) {
        dbFindFilter(user_id, image_id, subimage_id, filter)
        filter.callback((err, responce) => {
            dbFindCallback(err, responce, callback)
        })  
    })
}

var dbRemoveImage = function(user_id, image_id, subimage_id, callback) {
    // callback(err, image_info)
    
    db.remove().make(function(filter) {
        dbFindFilter(user_id, image_id, subimage_id, filter)
        filter.callback(function(err, count) {
            if (count === 0) {
                callback(new Error("Cannot find image by id " + image_id))
            } else {
                callback(err)
            }
        })
    })
}

module.exports = {
    init: function(db_file_path, db_files_cache_path) {
        db = nosql.load(db_file_path)
        cache = db_files_cache_path
    },
    addImage: function(user_id, image, callback) {
        // callback(err, image_id)
        // the function adds base (oridin) image to the DB
        
        filename = "origin_" + uuid() + ".jpg"
        image_id = getImageId(user_id, image)
        image_file = getImagePath(user_id, image_id, filename)
        image_folder = path.dirname(image_file)
        timestamp = new Date().toISOString()
        
        console.log("addImage: ", 
            "user_id=", user_id, 
            "image_id=", image_id)
            
        image_info = { 
            user_id: user_id, 
            image_id: image_id,
            timestamp: timestamp,
            origin: true,
            filename: filename
        }

        // TODO: try-catch for Sync methods?
        if (fs.existsSync(image_folder)) {
            callback(new Error("Image already exisits [" + image_folder + "]"))
            return
        } else {
            fs.mkdirSync(image_folder, { recursive: true })
        }
        
        // Save an image to fs
        // in case of success - add record to db
        imageWriteToFile(image_file, image, (err, image_id) => {
            
            if (err) {
                callback(err)
                return
            }
            
            dbInsertOrUndate(image_info, (err) => {
                if (err) {
                    // remove the image folder
                    // try-catch for sync function?
                    rimraf.sync(path.dirname(image_file))
                }
                callback(err, image_id)
            })
        })
    },
    removeImage: function(user_id, image_id, callback) {
        // callback(err)
        // the function removes base (oridin) image from the DB
        // need to remove image folder with all images
        
        console.log("removeImage: ", 
            "user_id=", user_id, 
            "image_id=", image_id)
            
        image_folder = getImageFolder(user_id, image_id)
        
        rimraf(image_folder, function(err) {
            if (err) {
                callback(err)
                return
            }
            
            dbRemoveImage(user_id, image_id, null, callback)
        })
    },
    getImage: function(user_id, image_id, callback) {
        // callback(err, image_data)
        // return base (oridin) or sub-image data by ID
        
        console.log("getImage:", 
            "user_id=", user_id,
            "image_id=", image_id)
        
        dbFindImage(user_id, image_id, null, (err, image_info) => {
            
            if (err) {
                callback(err)
                return
            }
            
            console.log(" >>>>> IMAGE NAME: " + image_info.filename)
            image_file = getImagePath(user_id, image_id, image_info.filename)
            imageReadFromFile(image_file, callback)
        })
    },
    getImageList: function(user_id, callback) {
        // callback(err, image_list)
        
        console.log("getImageList: user_id=", user_id)
        
        // TODO: it should return list by ragne, 
        // like from 0 to 100, from 101 to 200 etc
        // e.g.: function (user_id, offset, count, callback)
        
        db.find().make(function(filter) {
            filter.where('user_id', user_id)
            filter.where('origin', true)
            filter.callback(callback)
        })
    },
    removeUserData: function(user_id, callback) {
        // callback(err)
        
        console.log("removeUser: user_id=", user_id)
        user_folder = getUserFolder(user_id)
        
        rimraf(user_folder, function(err) {
            if (err) {
                callback(err)
                return
            }
            
            db.remove().make(function(filter) {
                filter.where('user_id', user_id)
                filter.callback(function(err, count) {
                    callback(err)
                })
            })
        })
    },
    addSubImage: function(user_id, image_id, subimage, callback) {
        // callback(err, subimage_id)
        // the function adds subimage to the DB
        
        filename = "subimage_" + uuid() + ".jpg"
        subimage_id = getImageId(user_id, subimage)
        image_file = getImagePath(user_id, image_id, filename)
        timestamp = new Date().toISOString()
        
        console.log("addSubImage: ", 
            "user_id=", user_id, 
            "subimage_id=", subimage_id,
            "image_id=", image_id)

        image_info = { 
            user_id: user_id, 
            image_id: image_id,
            subimage_id: subimage_id,
            timestamp: timestamp,
            origin: false, //subimage
            filename: filename
        }
        
        dbFindImage(user_id, image_id, null, (err, _) => {
            
            if (err) {
                // there are no origin image
                callback(err)
                return
            }
            
            console.log(" >>>>> IMAGE NAME: " + image_info.filename)
            
            // Save an image to fs
            // in case of success - add record to db
            imageWriteToFile(image_file, subimage, (err, image_id) => {
                
                if (err) {
                    callback(err)
                    return
                }
                
                dbInsertOrUndate(image_info, (err) => {
                    if (err) {
                        // remove the sub-image only
                        // try-catch for sync function?
                        fs.unlinkSync(image_file)
                    }
                    callback(err, image_id)
                })
            })
        })
    },
    removeSubImage: function(user_id, image_id, subimage_id, callback) {
        // callback(err)
        // the function removes only sub-image from the DB and FS
        
        console.log("removeSubImage: ", 
            "user_id=", user_id,
            "image_id=", image_id,
            "subimage_id=", subimage_id) 
        
        dbFindImage(user_id, image_id, subimage_id, (err, image_info) => {
            
            if (err) {
                callback(err)
                return
            }
            
            image_file = getImagePath(user_id, image_id, image_info.filename)
            fs.unlink(image_file, (err) => {
                
                if (err) {
                    callback(err)
                    return
                }
                
                dbRemoveImage(user_id, image_id, subimage_id)
            })
        })
    },
    getSubImage: function(user_id, image_id, subimage_id, callback) {
        // callback(err, image_data)
        // return base (oridin) or sub-image data by ID
        
        console.log("getSubImage:", 
            "user_id=", user_id,
            "image_id=", image_id,
            "subimage_id=", subimage_id)
        
        dbFindImage(user_id, image_id, subimage_id, (err, image_info) => {
            
            if (err) {
                callback(err)
                return
            }
            
            console.log(" >>>>> IMAGE NAME: " + image_info.filename)
            image_file = getImagePath(user_id, image_id, image_info.filename)
            imageReadFromFile(image_file, callback)
        })
    },
    getSubImageList: function(user_id, image_id, callback) {
        // callback(err, image_list)
        
        console.log("getSubImageList: ", user_id, )
        
        // TODO: it should return list by ragne, 
        // like from 0 to 100, from 101 to 200 etc
        // e.g.: function(user_id, offset, count, callback)
        
        db.find().make(function(filter) {
            filter.where('user_id', user_id)
            filter.where('image_id', image_id)
            filter.where('origin', false)
            filter.callback(callback)
        })
    },
}

