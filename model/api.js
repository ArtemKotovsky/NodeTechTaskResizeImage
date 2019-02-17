const path = require('path')
const argValidator = require('arg-validator')
const assert = require('assert').strict;

const db = require('./nosql_db.js')
const img = require('./image_sharp.js')

/*
The user can use the mobile app to upload an image and pass resize parameters. In response, they will receive resized image
User can see a list of their earlier resized images with resizing results and resizing parameters
User can resize old image one more time passing old image id and new resize parameters
API has to return information about all errors in proper format for invalid user inputs.
All images should be returned as link to image and width and height values.

AUTH and USER managements are not a part of the API
*/

function reqError(err) {
    console.log(err)
    assert(err)
    return {
        error: 1, // not implemented, just set non zero
        error_message: err.message  
    }
}

function reqImage(user_id, image_id, subimage_id, width, height) {
    return {
        error: 0,
        user_id: user_id, 
        image_id: image_id, 
        subimage_id: subimage_id, 
        width: width, 
        height: height,
        subimage_link: ""
    }
}

function reqStatus(err) {
    if (err) return reqError(err)
    return { error: 0 }
}

function reqList(list) {
    return {
        error: 0,
        list: list,
    }
}

function createSubimage(res, user_id, width, height, image, image_id) {
    // resize the image
    img.resize(image, width, height, (err, subimage) => {
        if (err) return res.send(reqError(err))
        // save subimage
        var meta = {
            width: width, 
            height: height,
        }
        db.addSubImage(user_id, image_id, subimage, meta, (err, subimage_id) => {
            if (err) return res.send(reqError(err))
            return res.send(reqImage(user_id, image_id, subimage_id, width, height))
        })
    })
}

module.exports = {
    
    init: function(db_path) {
        db_file = path.join(db_path, "resize.api.db")
        db_cache = path.join(db_path, "cache")
        db.init(db_file, db_cache)
    },

    POST_image: function(req, res) {
        
        // creates new subimage by new image 'image' or old image 'image_id'
        // { user_id: str, 
        //   height: num, 
        //   width: num, 
        //   [image: str_base64 | image_id: str] 
        // }
        
        if(!req.body) return res.sendStatus(400)
        
        var arg = argValidator()
        arg('user_id', req.body.user_id).isString()
        arg('height', req.body.height).isString()
        arg('width', req.body.width).isString()
        arg.optional('image', req.body.image).isString()
        arg.optional('image_id', req.body.image_id).isString()
        
        if (!req.body.image && !req.body.image_id) {
            arg.addError('image', 'image or image_id must be defined')
        }
        
        if (req.body.image && req.body.image_id) {
            arg.addError('image', 'either image or image_id must be defined')
        }
        
        var width = parseInt(req.body.width)
        var height = parseInt(req.body.height)

        if (width.toString() != req.body.width) {
            arg.addError('width', 'must be number')
        }
        
        if (height.toString() != req.body.height) {
            arg.addError('height', 'must be number')
        }
        
        arg.throwsOnError()
        
        if (req.body.image) {
            // add new image and new subimage
            console.log("Add new image for", req.body.user_id)
            var image = Buffer.from(req.body.image, 'base64')
            db.addImage(req.body.user_id, image, (err, image_id) => {
                if (err) return res.send(reqError(err))
                // resize the image
                createSubimage(res, 
                    req.body.user_id, 
                    width, 
                    height, 
                    image, 
                    image_id)
            })
            return
        }
        
        if (req.body.image_id) {
            // add new subimage by existing image
            console.log("Add new subimage for", req.body.user_id)
            
            db.getImage(req.body.user_id, req.body.image_id, (err, image_data) => {
                if (err) return res.send(reqError(err))
                // resize the image
                createSubimage(res, 
                    req.body.user_id, 
                    width, 
                    height, 
                    image_data, 
                    req.body.image_id)
            })
            return
        }
        
        assert(!"never executes")
    },

    GET_image: function(req, res) {

        // get:
        //  * either user images list 
        //  * or subimages by image id
        //  * or subimage data
        // { user_id: str, [ image_id: str, [ subimage_id: str ]] }
        //
        
        if(!req.params) return res.sendStatus(400)
        
        var arg = argValidator()
        arg('user_id', req.params.user_id).isString()
        arg.optional('image_id', req.params.image_id).isString()
        arg.optional('subimage_id', req.params.subimage_id).isString()
        
        if (!req.params.image_id && req.params.subimage_id) {
            arg.addError('subimage_id', 'requires image_id')
        }
        
        arg.throwsOnError()
        
        if (req.params.subimage_id) {
            // get image data
            console.log("get image data", req.params.subimage_id)
            db.getSubImage(req.params.user_id, req.params.image_id, req.params.subimage_id, (err, image_data) => {
                if (err) return res.send(reqError(err))
                    
                res.writeHead(200, {'Content-Type': 'image/gif' })
                res.end(image_data, 'binary')
            })
            return
        }
        
        if (req.params.image_id) {
            // get list of images's resizes
            console.log("get list of images's resizes", req.params.image_id)
            db.getSubImageList(req.params.user_id, req.params.image_id, (err, image_list) => {
                if (err) return res.send(reqError(err))
                    
                data = []
                image_list.forEach(function(el) {
                    data.push({
                        image_id: el.image_id,
                        subimage_id: el.subimage_id,
                        timestamp: el.timestamp,
                        height: el.meta.height,
                        width: el.meta.width,
                        link: "/image/"+req.params.user_id+"/"+el.image_id+"/"+el.subimage_id+"/"
                        // /image/ - it is too bad to use it as here
                    })
                })
                
                // set header and data type? application/json
                res.send(reqList(data))
            })
            return
        }
        
        if (req.params.user_id) {
            // get list of user's images
            console.log("get list of user's images", req.params.user_id)
            db.getImageList(req.params.user_id, (err, image_list) => {
                if (err) return res.send(reqError(err))
                    
                data = []
                image_list.forEach(function(el) {
                    data.push({
                        image_id: el.image_id,
                        timestamp: el.timestamp,
                        link: "/image/"+req.params.user_id+"/"+el.image_id+"/"
                        // /image/ - it is too bad to use it as here
                    })
                })
                
                // set header and data type?
                res.send(reqList(data))
            })
            return
        }
    },
    
    DEL_image: function(req, res) {
        
        // deletes:
        //  * either user data 
        //  * or subimages and origin image 
        //  * or just one subimage
        // { user_id: str, [ image_id: str, [ subimage_id: str ]] }
        //
        
        if(!req.body) return res.sendStatus(400)
        
        var arg = argValidator()
        arg('user_id', req.body.user_id).isString()
        arg.optional('image_id', req.body.image_id).isString()
        arg.optional('subimage_id', req.body.subimage_id).isString()
        
        if (!req.body.image_id && req.body.subimage_id) {
            arg.addError('subimage_id', 'requires image_id')
        }
        
        arg.throwsOnError()
        
        if (req.body.subimage_id) {
            console.log("remove subimage", req.body.subimage_id)
            db.removeSubImage(req.body.user_id, req.body.image_id, req.body.subimage_id, (err) => {
                res.send(reqStatus(err))
            })
            return
        }
        
        if (req.body.image_id) {
            console.log("remove image", req.body.image_id)
            db.removeImage(req.body.user_id, req.body.image_id, (err) => {
                res.send(reqStatus(err))
            })
            return
        }
        
        if (req.body.user_id) {
            console.log("remove user", req.body.user_id)
            db.removeUserData(req.body.user_id, (err) => {
                res.send(reqStatus(err))
            })
            return
        }
        
        assert(!"never executes")
    },
}
