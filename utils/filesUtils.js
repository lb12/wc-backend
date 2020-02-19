"use strict";

/**
 * Obtiene el nombre de una foto junto con la extension de esta
 */
const getPhotoFilename = file => {
  const filePath = file.photo.path;
  const fileName = filePath.split("/")[3];

  return fileName;
};

module.exports = { getPhotoFilename };
