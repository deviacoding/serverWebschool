const express = require('express')
const app = express()
const port = 8000
const data = require("./data.json")
const mysql = require("mysql2/promise")

app.use(express.json())

app.get('/', async function(req, res) {
	res.status(200).json(data)
})

app.get('/contact/:name', (req, res) => {
	res.json({ name: req.params.name, phone: "0568392822" })
})

app.get('/usersByMySql', async (req, res) => {
	const connection = await mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password : '',
		database: 'webschool',
	  });

	  try {
		const [results, fields] = await connection.query('SELECT * FROM users');
	  
		console.log("results", results); // results contains rows returned by server
		console.log("fields", fields); // fields contains extra meta data about results, if available
		res.json({ data: results})
	  } catch (err) {
		console.log(err);
		res.status(400).json({err: err})
	  }
})

app.get('/articles', async (req, res) => {
	const connection = await mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password : '',
		database: 'webschool',
	  });

	  try {
		const [results, fields] = await connection.query('SELECT * FROM `articles`');
	  
		console.log("results", results); // results contains rows returned by server
		console.log("fields", fields); // fields contains extra meta data about results, if available
		res.json({ data: results})
	  } catch (err) {
		console.log(err);
		res.status(400).json({err: err})
	  }
})

app.get('/articles/:id', async (req, res) => {
	console.log("req.params.id", req.params.id)

	const connection = await mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password : '',
		database: 'webschool',
	  });

	  try {
		const [results, fields] = await connection.query('SELECT * FROM `articles` WHERE id = ?', [req.params.id]);
	  
		console.log("results", results); // results contains rows returned by server
		console.log("fields", fields); // fields contains extra meta data about results, if available
		res.json({ data: results})
	  } catch (err) {
		console.log(err);
		res.status(400).json({err: err})
	  }
})


app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})