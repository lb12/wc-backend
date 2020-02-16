'use strict';

const getPhotoFilename = file => {
  const filePath = file.photo.path;
  const fileName = filePath.split("/")[3];

  return fileName;
};


module.exports = {
  getPhotoFilename
};
