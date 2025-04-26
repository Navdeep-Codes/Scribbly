const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

function authenticate(req, res, next) {
    const sessionToken = req.headers['authorization'];

    if (!sessionToken) {
        return res.status(401).json({ error: 'Unauthorized. No session token provided.' });
    }

    const [username, timestamp] = Buffer.from(sessionToken, 'base64').toString('utf8').split(':');

    if (!username || !timestamp) {
        return res.status(401).json({ error: 'Invalid session token.' });
    }

    req.username = username; 
    next();
}

app.post('/api/entry/:date', authenticate, async (req, res) => {
    try {
        const username = req.username; 
        const date = req.params.date;
        const content = req.body.content;

        const userDir = path.join(__dirname, 'entries', username);
        const filePath = path.join(userDir, `${date}.md`);

        await fs.ensureDir(userDir);

        await fs.writeFile(filePath, content);

        res.json({ success: true, message: `Entry saved for user: ${username}` });
    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).json({ error: 'Failed to save entry' });
    }
});

app.get('/api/entry/:date', authenticate, async (req, res) => {
    try {
        const username = req.username; 
        const date = req.params.date;

        const filePath = path.join(__dirname, 'entries', username, `${date}.md`);

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
