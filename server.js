const express = require('express')
const app = express()
const port = 8001
const data = require("./data.json")
const mysql = require("mysql2/promise")
const cors = require('cors')
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt")
const SECRET = 'supersecretkey';
const SALT_ROUNDS = 10;

app.use(cors())

app.use(express.json())

function authenticate(req, res, next) {
    console.log("open")
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.sendStatus(401);
  
    const token = authHeader.split(' ')[1]; // ici on récupère le vrai token
  
    if (!token) return res.sendStatus(401);
  
    try {
      const decoded = jwt.verify(token, SECRET); // ici on vérifie "token" (et pas une variable inconnue)
      req.token = decoded;
      next();
    } catch (err) {
      console.error("Erreur JWT :", err.message);
      res.sendStatus(403);
    }
}

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
	res.status(200).send("I'm in live")
})

app.get('/secret',authenticate, async function(req, res) {
    console.log(req.token)
	res.status(200).json({message: "le secret est reveler", token : req.token} )
})




////////////////////Users\\\\\\\\\\\\\\\\\\\\\\\\\\\

app.post("/signup", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;
      const [result] = await pool.query(sql, [email, hashedPassword]);
  
      res.status(201).json({ message: 'Inscription en attente de validation' });
  
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }
      console.error("Erreur SQL : ", err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  });

app.post("/signin", async (req, res) => {
const { email, password } = req.body;

try {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const [results] = await pool.query(sql, [email]);

    if (results.length === 0) {
    return res.status(401).json({ message: 'Email invalide' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
    return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    if (!user.is_valid) {
    return res.status(403).json({ message: 'Compte non validé' });
    }

    const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: '24h' }
    );

    res.json({ token, role : user.role, email: user.email  });

} catch (err) {
    console.error('Erreur lors de la connexion :', err);
    res.status(500).json({ message: 'Erreur serveur' });
}
});

app.get('/contact/:name',authenticate, (req, res) => {
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

app.post('/articles',authenticate,  async (req, res) => {
    const { titre, intro, content, date_publication, photo, categorie } = req.body;

    if (!titre || !intro || !content) {
        return res.status(400).json({ message: 'Les champs titre, intro et content sont obligatoires.' });
    }

    try {
        const [results] = await pool.query(
            `INSERT INTO articles (titre, intro, content, date_publication, photo, categorie)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [titre, intro, content, date_publication || new Date(), photo || null, categorie]
        );

        console.log('Article créé avec succès :', results);
        res.status(201).json({ message: 'Article créé', id: results.insertId });
    } catch (err) {
        console.error('Erreur lors de la création de l\'article :', err);
        res.status(500).json({ err });
    }
});

app.put('/articles/:id', async (req, res) => {
    const { id } = req.params;
    const { titre, intro, content, date_publication, photo, categorie } = req.body;

    try {
        const [result] = await pool.query(
            `UPDATE articles 
             SET titre = ?, intro = ?, content = ?, date_publication = ?, photo = ?, categorie = ?
             WHERE id = ?`,
            [titre, intro, content, date_publication, photo,categorie,  id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Article non trouvé." });
        }

        console.log(`Article avec ID ${id} mis à jour.`);
        res.status(200).json({ message: "Article mis à jour avec succès." });
    } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'article :', err);
        res.status(500).json({ err });
    }
});

app.delete('/articles/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM articles WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Article non trouvé." });
        }

        console.log(`Article avec ID ${id} supprimé.`);
        res.status(200).json({ message: "Article supprimé avec succès." });
    } catch (err) {
        console.error('Erreur lors de la suppression de l\'article :', err);
        res.status(500).json({ err });
    }
});




////////////////////Quotes\\\\\\\\\\\\\\\\\\\\\\\\\\\

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
