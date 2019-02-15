const express = require('express')
const app = express()
const path = require('path')
const os = require('os')
const bodyParser = require('body-parser')
const fs = require('fs')
const sharp = require('sharp')

const db = require('./model/nosql_db.js')
const img = require('./model/image_sharp.js')

db.init("T:\\nodejs\\photo_resize_service\\database\\db.nosql", "T:\\nodejs\\photo_resize_service\\database\\cache\\");

image = fs.readFileSync('1getres.jpeg')
db.addImage("1", image, (err, id) => {
    if (err) {
        console.log("ERROR: ", err)
    } else {
        console.log("IMAGE ADDED:", id)
        
        img.resize(image, 50, 60, (err, data) => {
            
            if (err) {
                console.log("Error on image resize: ", err)
                return
            }
            
            console.log("DAATA: ", data)
            db.addSubImage("1", id, data, (err, id) => {
                if (err) {
                    console.log("ERROR: ", err)
                } else {
                    console.log("IMAGE ADDED:", id)
                }
            })
        })
    }
})





   // init(db_file_path, db_files_cache_path)
   // addImage(user_id, image, callback)
   // removeImage(user_id, image_id, callback)
   // getImage(user_id, image_id, callback)
   // getImageList(user_id, callback)
   // removeUserData(user_id, callback)
   // addSubImage(user_id, image_id, subimage, callback)
   // removeSubImage(user_id, image_id, callback)
   // getSubImageList(user_id, image_id, callback)





// db.getImageList("1", function(err, resp) {
//     console.log(resp);
// })


// db.getImage("1", "6afc939e3e4e59db81d10b48b8c1c646d52306f0ba7a53bb059f91a63a21e102")
// db.removeImage("1", "6afc939e3e4e59db81d10b48b8c1c646d52306f0ba7a53bb059f91a63a21e102")
// db.removeUser("1")



app.use(function log (req, res, next) {
  console.log([req.method, req.url].join(' '));
  next();
});





// app.use(express.static('public'));
// app.use(bodyParser.urlencoded({ extended: false }))

// app.set('view engine', 'jade');
app.get('/', function(req, res) {
    res.send("index");
});

// var server = app.listen(process.env.PORT || 3000, function() {
//     console.log('Listening on %s', process.env.PORT);
// });