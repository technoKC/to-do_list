import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import Todo from './models/Todo.js';

const secret = 'secret123';

await mongoose.connect('mongodb://localhost:27017/auth-todo', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.log);

const app = express();
app.use(cookieParser());
app.use(bodyParser.json({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:3000',
  })
);

// JWT verification middleware
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(403).json({ message: 'Token not provided' });
  }
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload; // Attach payload to request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/', (req, res) => {
  res.send('ok');
});

// Fetch user information (Protected route)
app.get('/user', verifyToken, (req, res) => {
  User.findById(req.user.id)
    .then((userInfo) => {
      if (!userInfo) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ id: userInfo._id, email: userInfo.email });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Register new user
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = new User({ password: hashedPassword, email });
  user
    .save()
    .then((userInfo) => {
      jwt.sign({ id: userInfo._id, email: userInfo.email }, secret, (err, token) => {
        if (err) return res.sendStatus(500);
        res.cookie('token', token).json({ id: userInfo._id, email: userInfo.email });
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Login user
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((userInfo) => {
      if (!userInfo) return res.sendStatus(401);
      const passOk = bcrypt.compareSync(password, userInfo.password);
      if (passOk) {
        jwt.sign({ id: userInfo._id, email }, secret, (err, token) => {
          if (err) return res.sendStatus(500);
          res.cookie('token', token).json({ id: userInfo._id, email: userInfo.email });
        });
      } else {
        res.sendStatus(401);
      }
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Logout user
app.post('/logout', (req, res) => {
  res.cookie('token', '').send();
});

// Get todos (Protected route)
app.get('/todos', verifyToken, (req, res) => {
  Todo.find({ user: new mongoose.Types.ObjectId(req.user.id) })
    .then((todos) => res.json(todos))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Add new todo (Protected route)
app.put('/todos', verifyToken, (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    done: false,
    user: new mongoose.Types.ObjectId(req.user.id),
  });
  todo
    .save()
    .then((todo) => res.json(todo))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Update todo status (Protected route)
app.post('/todos', verifyToken, (req, res) => {
  Todo.updateOne(
    {
      _id: new mongoose.Types.ObjectId(req.body.id),
      user: new mongoose.Types.ObjectId(req.user.id),
    },
    { done: req.body.done }
  )
    .then(() => res.sendStatus(200))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.listen(4000, () => console.log('Server running on http://localhost:4000'));
