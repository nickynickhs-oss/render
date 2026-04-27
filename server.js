const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const teeworldsUtils = require('teeworlds-utilities');

const { Skin, ColorCode } = teeworldsUtils;

const app = express();

app.get('/render', async (req, res) => {
  try {
    const { skin, firstcolor, secondcolor } = req.query;

    // Only skin is required
    if (!skin) {
      return res.status(400).json({ error: 'Missing parameter: skin' });
    }

    const skinUrl = `https://ddstats.tw/skins/${skin}.png`;
    const tempFile = path.join(os.tmpdir(), `skin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`);

    // Download the skin from remote URL
    await new Promise((resolve, reject) => {
      https.get(skinUrl, (response) => {
        if (response.statusCode === 404) {
          reject(new Error('Skin not found'));
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download skin: ${response.statusCode}`));
        }
        const file = fs.createWriteStream(tempFile);
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', reject);
      }).on('error', reject);
    });

    const skinInstance = new Skin();
    await skinInstance.load(tempFile);
    
    // Only apply colors if both are provided
    if (firstcolor && secondcolor) {
      skinInstance.colorTee(new ColorCode(parseInt(firstcolor)), new ColorCode(parseInt(secondcolor)));
    }

    skinInstance.render();

    const outputFile = path.join(os.tmpdir(), `skin-render-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`);
    await skinInstance.saveRenderAs(outputFile);
    
    const imageBuffer = fs.readFileSync(outputFile);
    
    // Cleanup temp files
    fs.unlink(tempFile, () => {});
    fs.unlink(outputFile, () => {});

    res.set('Content-Type', 'image/png');
    res.set('Content-Length', imageBuffer.length);
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error:', error);
    res.status(error.message === 'Skin not found' ? 404 : 500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

app.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});
