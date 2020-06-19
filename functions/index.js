const functions = require('firebase-functions')
const admin = require('firebase-admin')

const app = require('express')()
admin.initializeApp()

const firebaseConfig = {
	apiKey: 'AIzaSyAKiTY5_P5VwR7GDIMG9XIEaC_GOO1IL6s',
	authDomain: 'social-app-d3519.firebaseapp.com',
	databaseURL: 'https://social-app-d3519.firebaseio.com',
	projectId: 'social-app-d3519',
	storageBucket: 'social-app-d3519.appspot.com',
	messagingSenderId: '964857170645',
	appId: '1:964857170645:web:d37eabd273a28481e9705c',
	measurementId: 'G-TGEMPZJ834',
}

const firebase = require('firebase')
firebase.initializeApp(firebaseConfig)

const db = admin.firestore()

app.get('/posts', (req, res) => {
	db.collection('posts')
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			let posts = []

			data.forEach((doc) => {
				posts.push({
					postId: doc.id,
					body: doc.data().body,
					userHandle: doc.data().userHandle,
					createdAt: doc.data().createdAt,
				})
			})

			return res.json(posts)
		})
		.catch((err) => {
			console.error(err)
			res.status(500).json({ error: err.code })
		})
})

//Piece of middleware to stop if something happens
const FBAuth = (req, res, next) => {
	let tokenId
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer ')
	) {
		tokenId = req.headers.authorization.split('Bearer ')[1]
	} else {
		console.error('No token found')
		return res.status(403).json({ error: 'Unauthorized' })
	}

	admin
		.auth()
		.verifyIdToken(tokenId)
		.then((decodedToken) => {
			req.user = decodedToken
			console.log(decodedToken)
			return db
				.collection('users')
				.where('userId', '==', req.user.uid)
				.limit(1)
				.get()
		})
		.then((data) => {
			req.user.handle = data.docs[0].data().handle
			return next()
		})
		.catch((err) => {
			console.error('Error while verifying token', err)
			return res.status(403).json(err)
		})
}

// Post
app.post('/post', FBAuth, (req, res) => {
	// if (req.method !== 'POST') {
	// 	let methodMessage = res.status(400).json({ error: 'Method not allowed' })
	// 	return methodMessage
	// }

	if (req.body.body.trim() === '') {
		return res.status(400).json({ body: 'Body must not be empty' })
	}

	const newPost = {
		body: req.body.body,
		userHandle: req.user.handle,
		createdAt: new Date().toISOString(),
	}

	db.collection('posts')
		.add(newPost)
		.then((doc) => {
			let messageResponse = res.json({
				message: `document ${doc.id} created successfully`,
			})
			return messageResponse
		})
		.catch((err) => {
			res
				.status(500) /*server error*/
				.json({ error: 'something went wrong' })
			console.error(err)
		})
})

//Validation route
const isEmpty = (string) => {
	if (string.trim() === '') return true
	else return false
}

const isEmail = (email) => {
	const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	if (email.match(emailRegEx)) return true
	else return false
}

//Signup route
app.post('/signup', (req, res) => {
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle,
	}

	//return all error together
	let errors = {}

	if (isEmpty(newUser.email)) {
		errors.email = 'Must not be empty'
	} else if (!isEmail(newUser.email)) {
		errors.email = 'Must be a valid email address'
	}

	if (isEmpty(newUser.password)) errors.password = 'Must not be empty'
	if (newUser.password !== newUser.confirmPassword)
		errors.confirmPassword = 'Passwords must match'
	if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty'

	if (Object.keys(errors).length > 0) return res.status(400).json(errors)

	//Validate data
	let token, userId

	db.doc(`/users/${newUser.handle}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return res
					.status(400)
					.json({ handle: 'this username is already taken' })
			} else {
				return firebase
					.auth()
					.createUserWithEmailAndPassword(newUser.email, newUser.password)
			}
		})
		.then((data) => {
			userId = data.user.uid
			return data.user.getIdToken()
		})
		.then((tokenId) => {
			token = tokenId

			const userCredentials = {
				handle: newUser.handle,
				email: newUser.email,
				createdAt: new Date().toISOString(),
				userId,
			}
			return db.doc(`/users/${newUser.handle}`).set(userCredentials)
		})
		.then((data) => {
			return res.status(201).json({ token })
		})
		.catch((err) => {
			console.error(err)
			if (err.code === 'auth/email-already-in-use') {
				return res.status(400).json({ email: 'Email is already in use' })
			} else {
				return res.status(500).json({ error: err.code })
			}
		})
})

//Login route
app.post('/login', (req, res) => {
	const user = {
		email: req.body.email,
		password: req.body.password,
	}

	let errors = {}

	if (isEmpty(user.email)) errors.email = 'Must not be empty'
	if (isEmpty(user.password)) errors.password = 'Must not be empty'

	if (Object.keys(errors).length > 0) return res.status(400).json(errors)

	firebase
		.auth()
		.signInWithEmailAndPassword(user.email, user.password)
		.then((data) => {
			return data.user.getIdToken()
		})
		.then((token) => {
			return res.json({ token })
		})
		.catch((err) => {
			console.error(err)
			if (err.code === 'auth/wrong-password') {
				return res
					.status(403)
					.json({ general: 'Wrong credentials, please try again' })
			}
			return res.status(500).json({ error: err.code })
		})
})

// endpoint https://baseurl/api (best practice prefix api)
exports.api = functions.region('europe-west1').https.onRequest(app)
