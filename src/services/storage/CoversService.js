const fs = require('fs');

class CoversService {
  constructor(folder) {
    this._folder = folder;
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeCover(file, meta) {
    const filename = +new Date() + meta.filename;
    const path = `${this._folder}/${filename}`;

    const fileStream = fs.createWriteStream(path);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream);
      file.on('end', () => resolve(filename));
    });
  }

  deleteCover(filename) {
    const file = filename.split('/').slice('-1').join('');
    const path = `${this._folder}/${file}`;

    fs.unlinkSync(path);
  }
}

module.exports = CoversService;
