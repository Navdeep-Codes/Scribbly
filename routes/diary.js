const express = require('express');
const router = express.Router();
const DiaryEntry = require('../models/DiaryEntry');

// Get all entries
router.get('/', async (req, res) => {
  try {
    const entries = await DiaryEntry.find().sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific entry
router.get('/:id', async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new entry
router.post('/', async (req, res) => {
  const entry = new DiaryEntry({
    content: req.body.content,
    title: req.body.title || 'Untitled Entry',
    formattedContent: req.body.formattedContent
  });

  try {
    const newEntry = await entry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an entry
router.patch('/:id', async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    
    if (req.body.content) entry.content = req.body.content;
    if (req.body.title) entry.title = req.body.title;
    if (req.body.formattedContent) entry.formattedContent = req.body.formattedContent;
    entry.lastModified = Date.now();
    
    const updatedEntry = await entry.save();
    res.json(updatedEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    
    await entry.remove();
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;