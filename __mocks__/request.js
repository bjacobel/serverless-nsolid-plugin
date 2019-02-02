const { Readable } = require("stream");

module.exports = jest.fn(() => {
  const readable = new Readable();
  readable._read = () => {};
  readable.push("data");
  return readable;
});
