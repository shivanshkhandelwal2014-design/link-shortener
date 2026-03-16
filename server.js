const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
const linksFile = path.join(dataDir, 'links.json');

// Initialize data file
async function initializeDataFile() {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir);
    }
    
    try {
        await fs.access(linksFile);
    } catch {
        await fs.writeFile(linksFile, JSON.stringify({ links: [] }));
    }
}

initializeDataFile();

// Helper function to read links
async function readLinks() {
    const data = await fs.readFile(linksFile, 'utf8');
    return JSON.parse(data);
}

// Helper function to write links
async function writeLinks(links) {
    await fs.writeFile(linksFile, JSON.stringify(links, null, 2));
}

// Generate short code
function generateShortCode() {
    return crypto.randomBytes(3).toString('hex');
}

// API Routes
app.post('/api/shorten', async (req, res) => {
    try {
        const { longUrl } = req.body;
        
        if (!longUrl) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL
        try {
            new URL(longUrl);
        } catch {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const data = await readLinks();
        const shortCode = generateShortCode();
        const shortUrl = `http://localhost:${PORT}/${shortCode}`;
        
        const newLink = {
            id: shortCode,
            original: longUrl,
            short: shortUrl,
            created: new Date().toISOString().split('T')[0]
        };

        data.links.unshift(newLink); // Add to beginning for latest first
        if (data.links.length > 20) {
            data.links = data.links.slice(0, 20); // Keep only last 20
        }

        await writeLinks(data);
        
        res.json(newLink);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/links', async (req, res) => {
    try {
        const data = await readLinks();
        res.json(data.links);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Redirect route
app.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const data = await readLinks();
        const link = data.links.find(l => l.id === code);
        
        if (link) {
            res.redirect(link.original);
        } else {
            res.status(404).send('Link not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
