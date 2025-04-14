const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});

app.get('/notes', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/notes.html'));
});

app.get('/planner', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/planner.html'));
});

app.get('/habits', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/habits.html'));
});

app.get('/math', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/math.html'));
});
