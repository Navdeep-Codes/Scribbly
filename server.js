const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure entries directory exists
const entriesDir = path.join(__dirname, 'entries');
fs.ensureDirSync(entriesDir);

// API endpoint to get a notebook entry
app.get('/api/entry/:date', async (req, res) => {
    try {
        const date = req.params.date;
        const filePath = path.join(entriesDir, `${date}.md`);
        
        if (await fs.pathExists(filePath)) {
            const content = await fs.readFile(filePath, 'utf8');
            res.json({ content });
        } else {
            res.json({ content: '' });
        }
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ error: 'Failed to read entry' });
    }
});

// API endpoint to save a notebook entry
app.post('/api/entry/:date', async (req, res) => {
    try {
        const date = req.params.date;
        const content = req.body.content;
        const filePath = path.join(entriesDir, `${date}.md`);
        
        await fs.writeFile(filePath, content);
        
        res.json({ success: true, message: 'Entry saved successfully' });
    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).json({ error: 'Failed to save entry' });
    }
});

// API endpoint to list all entries
app.get('/api/entries', async (req, res) => {
    try {
        const files = await fs.readdir(entriesDir);
        const entries = files
            .filter(file => file.endsWith('.md'))
            .map(file => file.replace('.md', ''));
            
        res.json({ entries });
    } catch (error) {
        console.error('Error listing entries:', error);
        res.status(500).json({ error: 'Failed to list entries' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Notebook entries will be saved to ${entriesDir}`);
});