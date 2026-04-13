const { titleSlide, sectionSlide } = require("./slide-templates");

function buildPitchDeck(deck) {
  const slides = [];
  slides.push((slide) => titleSlide(slide, { heading: "Persado PMM", subheading: "Pitch deck preset" }));
  slides.push((slide) => sectionSlide(slide, { title: "Why it matters", bullets: ["4× faster production", "75% lower cost", "Compliance built in"] }));
  return slides;
}

module.exports = { buildPitchDeck };
