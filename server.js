const express = require('express')
const app = express()
const port = 8001
const data = require("./data.json")
const mysql = require("mysql2/promise")
const cors = require('cors')

app.use(cors())

app.use(express.json())

const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'webschool',
	// waitForConnections: true,
	// connectionLimit: 10, // Limite de connexions simultanées
	// queueLimit: 0
});

app.get('/', async function(req, res) {
	res.status(200).json(data)
})

app.get('/contact/:name', (req, res) => {
	res.json({ name: req.params.name, phone: "0568392822" })
})

app.get('/usersMySql', async (req, res) => {
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

app.delete('/users/:id', async (req, res) => {
    console.log("Received request to delete article with id:", req.params.id);

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'webschool',
    });

    try {
        const [results] = await connection.query('DELETE FROM `users` WHERE id = ?', [req.params.id]);

        if (results.affectedRows > 0) {
            console.log(`Article with id ${req.params.id} deleted successfully`);
            res.status(200).json({ message: `Article with id ${req.params.id} deleted successfully` });
        } else {
            console.log(`No article found with id ${req.params.id}`);
            res.status(404).json({ message: `No article found with id ${req.params.id}` });
        }
    } catch (err) {
        console.log("Error executing query", err);
        res.status(400).json({ err: err });
    }
});

////////////////////Articles\\\\\\\\\\\\\\\\\\\\\\\\\\\

app.get('/articles', async (req, res) => {
	const connection = await mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password : '',
		database: 'webschool',
	  });

	  try {
		const [results, fields] = await connection.query('SELECT * FROM `articles`');
	  
		// console.log("results", results); // results contains rows returned by server
		// console.log("fields", fields); // fields contains extra meta data about results, if available
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
	  
		// console.log("results", results); // results contains rows returned by server
		//console.log("fields", fields); // fields contains extra meta data about results, if available
		res.json({ data: results})
	  } catch (err) {
		console.log(err);
		res.status(400).json({err: err})
	  }
})


////////////////////Quotes\\\\\\\\\\\\\\\\\\\\\\\\\\\

app.post('/quotes', async (req, res) => {
    const { name, email, phone, service, commentaire } = req.body;

    if (!name || !email || !phone || !service || !commentaire) {
        return res.status(400).json({ message: 'All fields (name, email, phone, service, commentaire) are required.' });
    }

    try {
        const [results] = await pool.query(
            'INSERT INTO quotes (name, email, phone, service, commentaire) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, service, commentaire]
        );

        console.log('Quote inserted successfully:', results);
        res.status(201).json({ message: 'Quote created successfully', id: results.insertId });
    } catch (err) {
        console.log('Error inserting quote:', err);
        res.status(500).json({ err: err });
    }
});

app.get('/quotes', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM quotes');
        
        console.log('Quotes retrieved successfully:', results);
        res.status(200).json({ data: results });
    } catch (err) {
        console.log('Error retrieving quotes:', err);
        res.status(500).json({ err: err });
    }
});

app.put('/quotes/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, service, status, commentaire } = req.body;

    try {
        const [result] = await pool.query(
            `UPDATE quotes 
             SET name = ?, email = ?, phone = ?, service = ?, status = ?, commentaire = ? 
             WHERE id = ?`,
            [name, email, phone, service, status, commentaire, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Quote not found" });
        }

        console.log(`Quote with ID ${id} updated successfully`);
        res.status(200).json({ message: "Quote updated successfully" });
    } catch (err) {
        console.error('Error updating quote:', err);
        res.status(500).json({ err: err });
    }
});

app.delete('/quotes/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM quotes WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Quote not found" });
        }

        console.log(`Quote with ID ${id} deleted successfully`);
        res.status(200).json({ message: "Quote deleted successfully" });
    } catch (err) {
        console.error('Error deleting quote:', err);
        res.status(500).json({ err: err });
    }
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})







