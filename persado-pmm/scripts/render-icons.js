const { renderToString } = require("react-dom/server");
const sharp = require("sharp");
const React = require("react");

async function iconToBase64(IconComponent, color, size = 48) {
  const svg = renderToString(
    React.createElement(IconComponent, { color, size })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return buf.toString("base64");
}

module.exports = { iconToBase64 };
