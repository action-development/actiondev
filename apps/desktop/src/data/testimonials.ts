export interface Testimonial {
  id: string;
  name: string;
  project: string;
  quote: string;
  quoteEs?: string;
  avatar?: string;
  idea?: string;
  ideaEs?: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "almudena-muhle",
    name: "Almudena Muhle",
    project: "ALMUDENA MUHLE",
    quote:
      "Incredible work on my website. From day one they understood what I needed and brought it to life perfectly. 100% recommended.",
    quoteEs:
      "Increíble trabajo con mi página web. Desde el primer momento entendió lo que necesitaba y supo plasmarlo a la perfección. Sin duda lo recomiendo al 100%.",
  },
  {
    id: "ivan-matas",
    name: "Iván Matas",
    project: "CLIENTE — 2026",
    quote:
      "Pablo is the real deal. Sublime quality and record time, perfectly tailored to my needs with flawless treatment. Absolutely would do it again — I'd regret not putting my site in his hands.",
    quoteEs:
      "Pablo es un completo crack. Calidad sublime y en tiempo récord, ajustándose al 100% a mis necesidades y con un trato de 10. Sin duda volvería a repetir, me arrepentiría de no haber puesto mi web en sus manos.",
  },
  {
    id: "yonday",
    name: "YondayX",
    project: "KAIROS FUTURES",
    quote:
      "Great experience working with Action. They listened and took the time to understand what I needed. Impeccable work that captured exactly what I had in mind for the Kairos Future points store.",
    quoteEs:
      "Gran experiencia trabajando con Action. Escuchó y dedicó tiempo a entender lo que pedía. Su trabajo es impecable y supo plasmar justo lo que tenía en mente para la tienda de puntos de Kairos Future.",
  },
  {
    id: "samuel-flores",
    name: "Samuel D. Flores",
    project: "NAUTIRENT",
    quote:
      "Completely reliable — the website they built for us is pure elegance. Friendly, attentive and efficient throughout.",
    quoteEs:
      "100% responsable, una elegancia la web que nos hizo. Muy amable, siempre atento y eficiente.",
  },
  {
    id: "noa-martinez",
    name: "Noa Martínez",
    project: "CLIENTE",
    quote:
      "Two words: PROFESSIONALISM and SPEED. I dreamed up my website and Pablo made it real, exceeding every expectation.",
    quoteEs:
      "Solo dos palabras: PROFESIONALIDAD y RAPIDEZ. Soñé con mi página web y Pablo lo hizo realidad, superando incluso las expectativas.",
  },
  {
    id: "pablo-r",
    name: "Pablo R.",
    project: "LOCAL GUIDE · GOOGLE",
    quote:
      "Excellent experience. From day one they showed deep expertise and professionalism. They met every deadline, with standout attention to detail.",
    quoteEs:
      "Excelente experiencia. Desde el primer momento demostraron profesionalismo y un conocimiento profundo. Cumplieron todos los plazos acordados y destaca la atención al detalle.",
  },
];
