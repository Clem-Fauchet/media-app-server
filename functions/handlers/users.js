const { db } = require('../utility/admin')

const config = require('../utility/config')

const firebase = require('firebase')
firebase.initializeApp(config)

const { validateSignUpData, validateLoginData } = require('../utility/validate')

exports.signUp = (req, res) => {
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle,
	}

	const { valid, errors } = validateSignUpData(newUser)

	if (!valid) return res.status(400).json({ errors })

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
}

exports.login = (req, res) => {
	const user = {
		email: req.body.email,
		password: req.body.password,
	}

	const { valid, errors } = validateLoginData(user)

	if (!valid) return res.status(400).json({ errors })

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
}
