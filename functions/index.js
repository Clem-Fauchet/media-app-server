const functions = require('firebase-functions')

const app = require('express')()

const FBAuth = require('./utility/fbAuth')

const {
	getAllPosts,
	postOnePost,
	getPost,
	commentOnPost,
	likePost,
	unlikePost,
	deletePost,
} = require('./handlers/posts')
const {
	signUp,
	login,
	uploadImages,
	addUserDetails,
	getAuthenticatedUser,
} = require('./handlers/users')

//Posts routes
app.get('/posts', getAllPosts)
//Post one post
app.post('/post', FBAuth, postOnePost)
app.get('/post/:postId', getPost) //root parameter so we can access its value
app.post('/post/:postId/comment', FBAuth, commentOnPost)
app.get('/post/:postId/like', FBAuth, likePost)
app.get('/post/:postId/unlike', FBAuth, unlikePost)
app.delete('/post/:postId', FBAuth, deletePost)

//Users routes
app.post('/signup', signUp)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImages)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)

// endpoint https://baseurl/api (best practice prefix api)
exports.api = functions.region('europe-west1').https.onRequest(app)
