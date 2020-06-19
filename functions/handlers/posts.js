const { db } = require('../utility/admin')

exports.getAllPosts = (req, res) => {
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
}

exports.postOnePost = (req, res) => {
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
}
