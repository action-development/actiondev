export interface Testimonial {
  id: string;
  name: string;
  project: string;
  quote: string;
  quoteEs?: string;
  avatar?: string;
  idea?: string;
  ideaEs?: string;
  /** Puntuación de la reseña de Google, 1-5. Todas las reseñas reales
   * recogidas hasta ahora son 5/5. */
  rating: number;
  /**
   * Género del cliente detrás de la reseña, para que su muñeco en la plaza
   * (`/resenas`) salga con rasgos masculinos/femeninos a juego con el nombre.
   * Se omite en alias, handles o nombres de empresa (p. ej. "#ratsquad") —
   * `buildDolls` en `plaza-config.ts` sortea el peinado sin sesgo de género
   * en ese caso.
   */
  gender?: "male" | "female";
}

export const testimonials: Testimonial[] = [
  {
    id: "almudena-muhle",
    name: "Almudena Muhle",
    project: "ALMUDENA MUHLE",
    rating: 5,
    gender: "female",
    quote:
      "Incredible work on my website. From day one they understood what I needed and brought it to life perfectly. 100% recommended.",
    quoteEs:
      "Increíble trabajo con mi página web. Desde el primer momento entendió lo que necesitaba y supo plasmarlo a la perfección. Sin duda lo recomiendo al 100%.",
  },
  {
    id: "ivan-matas",
    name: "Iván Matas",
    project: "CLIENTE — 2026",
    rating: 5,
    gender: "male",
    quote:
      "Pablo is the real deal. Sublime quality and record time, perfectly tailored to my needs with flawless treatment. Absolutely would do it again — I'd regret not putting my site in his hands.",
    quoteEs:
      "Pablo es un completo crack. Calidad sublime y en tiempo récord, ajustándose al 100% a mis necesidades y con un trato de 10. Sin duda volvería a repetir, me arrepentiría de no haber puesto mi web en sus manos.",
  },
  {
    id: "yonday",
    name: "YondayX",
    project: "KAIROS FUTURES",
    rating: 5,
    quote:
      "Great experience working with Action. They listened and took the time to understand what I needed. Impeccable work that captured exactly what I had in mind for the Kairos Future points store.",
    quoteEs:
      "Gran experiencia trabajando con Action. Escuchó y dedicó tiempo a entender lo que pedía. Su trabajo es impecable y supo plasmar justo lo que tenía en mente para la tienda de puntos de Kairos Future.",
  },
  {
    id: "samuel-flores",
    name: "Samuel D. Flores",
    project: "NAUTIRENT",
    rating: 5,
    gender: "male",
    quote:
      "Completely reliable — the website they built for us is pure elegance. Friendly, attentive and efficient throughout.",
    quoteEs:
      "100% responsable, una elegancia la web que nos hizo. Muy amable, siempre atento y eficiente.",
  },
  {
    id: "noa-martinez",
    name: "Noa Martínez",
    project: "CLIENTE",
    rating: 5,
    gender: "female",
    quote:
      "Two words: PROFESSIONALISM and SPEED. I dreamed up my website and Pablo made it real, exceeding every expectation.",
    quoteEs:
      "Solo dos palabras: PROFESIONALIDAD y RAPIDEZ. Soñé con mi página web y Pablo lo hizo realidad, superando incluso las expectativas.",
  },
  {
    id: "pablo-r",
    name: "Pablo R.",
    project: "LOCAL GUIDE · GOOGLE",
    rating: 5,
    gender: "male",
    quote:
      "Excellent experience. From day one they showed deep expertise and professionalism. They met every deadline, with standout attention to detail.",
    quoteEs:
      "Excelente experiencia. Desde el primer momento demostraron profesionalismo y un conocimiento profundo. Cumplieron todos los plazos acordados y destaca la atención al detalle.",
  },
  {
    id: "nabi-nabi",
    name: "Nabi Nabi",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    quote:
      "It was a pleasure working with them. They helped me every step of the way and the website turned out exactly as I wanted. I'd highlight their professionalism and speed — I'd definitely recommend them.",
    quoteEs:
      "Ha sido un placer trabajar con ellos. Me ayudaron en todo momento y la web ha quedado justo como quería. Destaco su profesionalidad y rapidez. Sin duda los recomendaría.",
  },
  {
    id: "ratsquad",
    name: "#ratsquad",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    quote:
      "Really happy with the work! They understood exactly what we needed and took it to another level. The site is fast, looks professional and everything works perfectly. 100% recommended.",
    quoteEs:
      "Muy contento con el trabajo! Ha entendido perfectamente lo que necesitábamos y lo ha llevado a otro nivel. La web va rápida, se ve profesional y todo funciona perfecto. 100% recomendable.",
  },
  {
    id: "carla-hermida",
    name: "Carla Hermida",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    gender: "female",
    quote:
      "I highly recommend them. They're approachable, flexible and always available to the client, both before and after launching our website.",
    quoteEs:
      "Los recomiendo encarecidamente. Son cercanos, flexibles y siempre están a disposición del cliente, antes y después de la puesta en marcha de nuestra página web.",
  },
  {
    id: "pablo-martinez-lamas",
    name: "Pablo Martínez Lamas",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    gender: "male",
    quote:
      "Super happy with the work. From the very first moment, extremely attentive and approachable.",
    quoteEs:
      "Súper contentos con el trabajo. Desde el primer momento, súper atentos y cercanos.",
  },
  {
    id: "rodri-vegas",
    name: "Rodri Vegas",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    gender: "male",
    quote:
      "If you're looking for a serious service and good customer care, this is your company.",
    quoteEs:
      "Si estás buscando un servicio serio y una atención al cliente buena, esta es tu empresa.",
  },
  {
    id: "carlos-alonso",
    name: "Carlos Alonso",
    project: "LOCAL EN REDONDELA",
    rating: 5,
    gender: "male",
    quote:
      "Impressive. We have a shop in Redondela and they built our website — the service and management were top notch, totally recommended.",
    quoteEs:
      "Impresionante. Tenemos un local en Redondela y nos creó la página web; el trato y la gestión fueron de 10, totalmente recomendable.",
  },
  {
    id: "adrian-rodriguez",
    name: "Adrián Rodríguez",
    project: "PARIS DE NOIA",
    rating: 5,
    gender: "male",
    quote:
      "We hired them to update the Paris de Noia website and they left it perfect, with a super modern, current touch. They work flawlessly.",
    quoteEs:
      "Contratamos sus servicios para actualizar la página web de Paris de Noia y la han dejado perfecta, con un toque súper moderno y actual. Trabajan impecablemente.",
  },
  {
    id: "julio-walker",
    name: "Julio Walker",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    gender: "male",
    quote:
      "They have a solution for literally everything — I've never come across anyone this professional. 100% recommended.",
    quoteEs:
      "Tienen solución para literalmente todo, no me he topado con nadie tan profesional en mi vida. 100% recomendable.",
  },
  {
    id: "fangfamily",
    name: "fangfamily.3",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    quote:
      "Everything perfect. Pablo is a very professional and friendly guy — highly recommended!",
    quoteEs:
      "Todo perfecto, Pablo un chico muy profesional y amable, muy recomendable!!!",
  },
  {
    id: "dominik-saworski",
    name: "Dominik Saworski",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    gender: "male",
    quote:
      "Pablo is very good and fast, available any time and always ready to help!",
    quoteEs:
      "Pablo es muy bueno y rápido, disponible en cualquier momento y siempre listo para ayudar!",
  },
  {
    id: "sleepy",
    name: "Sleepy",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    quote:
      "The professionalism and customer care are exceptional. Personally, my business has improved by 200% thanks to the service they gave me.",
    quoteEs:
      "La profesionalidad y la atención al cliente es excepcional. Personalmente, mi empresa ha mejorado en un 200% tras los servicios que me han brindado.",
  },
  {
    id: "eduardo-castro",
    name: "Eduardo Castro Avendaño",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    gender: "male",
    quote:
      "Fast, resourceful and driven to get the most out of every project — they've renewed my business's image with a clean, modern and dynamic website. Totally recommended!",
    quoteEs:
      "Rápido, resolutivo y con ganas de sacar el máximo potencial, ha renovado la imagen de mi negocio gracias a una web limpia, moderna y dinámica, totalmente recomendable!",
  },
  {
    id: "odiseo",
    name: "Odiseo",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    gender: "male",
    quote:
      "Pablo resolved all my doubts and helped me with what I needed. Way better than expected.",
    quoteEs:
      "Pablo resolvió todas mis dudas y me ayudó en lo que necesitaba. Muchísimo mejor de lo esperado.",
  },
  {
    id: "nuria-balaguer",
    name: "Nuria Balaguer",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    gender: "female",
    quote: "Great professional, 100% recommended.",
    quoteEs: "Gran profesional, 100% recomendado.",
  },
  {
    id: "katherine-tovar",
    name: "Katherine Tovar & Solarte",
    project: "RESEÑA DE GOOGLE",
    rating: 5,
    gender: "female",
    quote:
      "Very good work, reliable and responsible. Very happy with the result!",
    quoteEs:
      "Muy buen trabajo, confiable y responsable. Muy feliz con el resultado!",
  },
  {
    id: "rapeal-john",
    name: "Rapeal John",
    project: "APP EN VIGO",
    rating: 5,
    gender: "male",
    quote:
      "We hired Action Development to build our app in Vigo and the result has been spectacular. Pablo understood from day one what we needed.",
    quoteEs:
      "Contratamos a Action Development para desarrollar nuestra app en Vigo y el resultado ha sido espectacular. Pablo entendió desde el primer día lo que necesitábamos.",
  },
];
