function titleSlide(slide, options = {}) {
  const {
    heading = "Title",
    subheading = "Subtitle",
    backgroundColor = "#ffffff",
  } = options;

  slide.background = { fill: backgroundColor };
  slide.addText(heading, {
    x: 0.5,
    y: 1.0,
    fontSize: 32,
    color: "#ffffff",
    bold: true,
  });

  slide.addText(subheading, {
    x: 0.5,
    y: 2.0,
    fontSize: 18,
    color: "#ffffff",
  });
}

function sectionSlide(slide, options = {}) {
  const { title = "Section", bullets = [] } = options;
  slide.addText(title, { x: 0.5, y: 0.5, fontSize: 28, bold: true });
  slide.addText(bullets.join("\n"), {
    x: 0.5,
    y: 1.5,
    fontSize: 18,
    color: "#111827",
    bullet: true,
  });
}

module.exports = { titleSlide, sectionSlide };
