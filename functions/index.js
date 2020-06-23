const functions = require('firebase-functions')

const app = require('express')()

const FBAuth = require('./utility/fbAuth')

const { db } = require('./utility/admin')

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
	getUserDetails,
	markNotificationsRead,
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
app.get('/user/:handle', getUserDetails)
app.post('/notifications', FBAuth, markNotificationsRead)

// endpoint https://baseurl/api (best practice prefix api)
exports.api = functions.region('europe-west1').https.onRequest(app)

//Notifcation Like
exports.createNotificationOnLike = functions
	.region('europe-west1')
	.firestore.document('likes/{id}')
	.onCreate((snapshot) => {
		return db
			.doc(`/posts/${snapshot.data().postId}`)
			.get()
			.then((doc) => {
				if (doc.exists) {
					return db.doc(`/notifications/${snapshot.id}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						type: 'like',
						read: false,
						postId: doc.id,
					})
				} else {
					return null
				}
			})
			.then(() => {
				return
			})
			.catch((err) => {
				console.error(err)
				return err
			})
	})

//Delete notification on unlike
exports.deleteNotificationOnUnlike = functions
	.region('europe-west1')
	.firestore.document('likes/{id}')
	.onDelete((snapshot) => {
		return db
			.doc(`/notifications/${snapshot.id}`)
			.delete()
			.then(() => {
				return
			})
			.catch((err) => {
				console.error(err)
				return err
			})
	})

//Notification Comments
exports.createNotificationOnComment = functions
	.region('europe-west1')
	.firestore.document('comments/{id}')
	.onCreate((snapshot) => {
		return db
			.doc(`/posts/${snapshot.data().postId}`)
			.get()
			.then((doc) => {
				if (doc.exists) {
					return db.doc(`/notifications/${snapshot.id}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						type: 'comment',
						read: false,
						postId: doc.id,
					})
				} else {
					return null
				}
			})
			.then(() => {
				return
			})
			.catch((err) => {
				console.error(err)
				return err
			})
	})
