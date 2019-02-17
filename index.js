const express = require('express')
const app = express()
const os = require('os')
const bodyParser = require('body-parser')
const api = require('./model/api.js')

app.use(function log (req, res, next) {
    console.log([req.method, req.url].join(' '))
    next()
})

// app.use(express.static('public'))
// app.set('view engine', 'jade')
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))

app.get('/', function(req, res) {
    res.send("index")
})

api.init("database\\db.nosql", "database\\cache\\")
app.post("/image", api.POST_image)
app.delete("/image", api.DEL_image)
app.get("/image/:user_id/", api.GET_image)
app.get("/image/:user_id/:image_id/", api.GET_image)
app.get("/image/:user_id/:image_id/:subimage_id/", api.GET_image)

var server = app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on %s', process.env.PORT || 3000)
})