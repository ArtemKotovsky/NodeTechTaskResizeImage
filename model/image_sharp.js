const sharp = require('sharp')

/*
  IMAGE INTERFACE 
  
    resize(image, width, heigh, callback)
    resize(image, width, heigh, x, y, callback)
    resize(image, width, heigh, x, y, other_optional_args, callback)
*/

module.exports = {
    resize: function(image, width, heigh, callback) {
        // callback(err, data)
        
        // TODO: add ability to use x, y - coordinate of top left coner 
        //       x, y must be options, default is center

        console.log("ERROR: ", image)
        
        sharp(image)
            .resize(width, heigh)
            .toBuffer()
            .then( data => callback(null, data) )
            .catch( err => callback(err) );
    },
}

