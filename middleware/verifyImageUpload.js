const fs = require('fs').promises;

const detectImageType = (buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'image/png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
};

const removeFiles = async (files) => {
  await Promise.allSettled(files.map((file) => fs.unlink(file.path)));
};

const verifyImageUpload = async (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return next();

  try {
    for (const file of files) {
      const handle = await fs.open(file.path, 'r');
      const header = Buffer.alloc(16);
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      await handle.close();
      const actualType = detectImageType(header.subarray(0, bytesRead));
      const declaredType = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
      if (!actualType || actualType !== declaredType) {
        await removeFiles(files);
        return res.status(400).json({
          success: false,
          error: { message: 'Uploaded file content is not a valid JPEG, PNG, or WebP image', statusCode: 400 },
        });
      }
    }
    return next();
  } catch (error) {
    await removeFiles(files);
    return next(error);
  }
};

module.exports = { verifyImageUpload, detectImageType };
