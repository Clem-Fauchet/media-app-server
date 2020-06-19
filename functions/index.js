const functions = require('firebase-functions')

const app = require('express')()

const FBAuth = require('./utility/fbAuth')

const { getAllPosts, postOnePost } = require('./handlers/posts')
const { signUp, login, uploadImages } = require('./handlers/users')

//Posts routes
app.get('/posts', getAllPosts)
//Post one post
app.post('/post', FBAuth, postOnePost)

//Users routes
app.post('/signup', signUp)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImages)

// endpoint https://baseurl/api (best practice prefix api)
exports.api = functions.region('europe-west1').https.onRequest(app)
