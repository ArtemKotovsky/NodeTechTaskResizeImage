const sharp = require('sharp')

/*
  IMAGE INTERFACE 
  
    resize(image, width, heigh, callback(err, data))
    resize(image, width, heigh, x, y, callback(err, data))
    resize(image, width, heigh, x, y, other_optional_args, callback(err, data))
*/

isNumeric = function(n){
  return (typeof n == "number" && !isNaN(n));
}

module.exports = {
    resize: function(image, width, heigh, callback) {
        // callback(err, data)
        
        // TODO: add ability to use x, y - coordinate of top left coner 
        //       x, y must be options, default is center

        if (!isNumeric(width) || width <= 1) {
            callback(new Error("Width should be positive integer and > 1"))
            return
        }
        
        if (!isNumeric(heigh) || heigh <= 1) {
            callback(new Error("heigh should be positive integer and > 1"))
            return
        }
        
        try {
            sharp(image)
                .resize(width, heigh)
                .toBuffer()
                .then( data => callback(null, data) )
                .catch( err => callback(err) );
        } catch (err) {
            callback(err)
        }
    },
}

