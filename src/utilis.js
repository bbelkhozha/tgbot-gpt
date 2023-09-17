import fs from 'fs';

export function removeFile(path) {
  fs.unlink(path, (err) => {
    if (err) {
      console.log(`Error while removing file: ${err.message}`);
    } else {
      console.log(`Successfully removed file: ${path}`);
    }
  });
}
