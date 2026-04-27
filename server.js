const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const teeworldsUtils = require('teeworlds-utilities');

const { Skin, ColorCode } = teeworldsUtils;

const app = express();
const skinsDir = path.join(__dirname, 'skins');

app.get('/render', async (req, res) => {
  try {
    const { skin, firstcolor, secondcolor } = req.query;

    // Only skin is required
    if (!skin) {
      return res.status(400).json({ error: 'Missing parameter: skin' });
    }

    const skinPath = path.join(skinsDir, `${skin}.png`);

    if (!fs.existsSync(skinPath)) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    const skinInstance = new Skin();
    await skinInstance.load(skinPath);
    
    // Only apply colors if both are provided
    if (firstcolor && secondcolor) {
      skinInstance.colorTee(new ColorCode(parseInt(firstcolor)), new ColorCode(parseInt(secondcolor)));
    }

    skinInstance.render();

    const tempFile = path.join(os.tmpdir(), `skin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`);
    await skinInstance.saveRenderAs(tempFile);
    
    const imageBuffer = fs.readFileSync(tempFile);
    fs.unlink(tempFile, () => {});

    res.set('Content-Type', 'image/png');
    res.set('Content-Length', imageBuffer.length);
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
