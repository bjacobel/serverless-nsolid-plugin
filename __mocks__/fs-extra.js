const { Writable } = require("stream");

module.exports = {
  mkdirp: jest.fn(() => Promise.resolve()),
  createWriteStream: jest.fn(() => {
    const writable = new Writable();
    writable._write = () => writable.emit("finish");
    return writable;
  }),
  unlink: jest.fn(() => Promise.resolve()),
  rename: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
};
