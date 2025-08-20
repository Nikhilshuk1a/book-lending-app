import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:4200' }));

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'book_lending',
});

// Get all books
app.get('/books', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM books ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Add new book
app.post('/books', async (req, res) => {
  const { title, author } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO books (title, author, status) VALUES ($1, $2, $3) RETURNING *',
      [title, author, 'available']
    );
    res.status(201).json(result.rows[0]); // Return the created book with ID and status
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Update book title and author
app.put('/books/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author } = req.body;
  try {
    const result = await pool.query(
      'UPDATE books SET title=$1, author=$2 WHERE id=$3',
      [title, author, id]
    );
    if (result.rowCount === 0) return res.status(404).send('Book not found');
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Delete book by id
app.delete('/books/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM books WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).send('Book not found');
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Toggle book status (available / borrowed)
app.patch('/books/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // expected 'available' or 'borrowed'
  if (!['available', 'borrowed'].includes(status)) {
    return res.status(400).send('Invalid status value');
  }
  try {
    const result = await pool.query(
      'UPDATE books SET status=$1 WHERE id=$2',
      [status, id]
    );
    if (result.rowCount === 0) return res.status(404).send('Book not found');
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(8080, () => console.log('Backend running on http://localhost:8080'));
