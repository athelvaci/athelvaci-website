
module.exports = {
  siteMetadata: {
    title: `Ahmet Tufan HELVACI`,
    author: `Ahmet Tufan HELVACI`,
    firstName: `Ahmet Tufan`,
    lastName: `HELVACI`,
    description: `Ahmet Tufan's personal site`,
    occupation: `Web and Backend Java Developer`,
    keywords: [`Ahmet Tufan`, `Helvaci`, `Personal`, `Blog`, `Resume`, `Projects`, `Backend Developer`,`Java Developer`],
    homeLocation: `Istanbul`,
    siteUrl:
      process.env.URL || process.env.DEPLOY_URL || `http://localhost:8000`,
    unemployed: true,
    designations: [
      `Software Engineer`,
      `Backend-Java Developer`,
      `Blockchain Enthusiast`,
      `Master Student`,
    ],
    readingList: [
      {
        title: `Effective Java`,
        author: `Joshua Bloch`,
        link: `https://www.goodreads.com/book/show/34927404-effective-java`,

      },
      {
        title: `Grokking Algorithms`,
        author: `Aditya Bhargava`,
        link: `https://www.goodreads.com/book/show/22847284-grokking-algorithms-an-illustrated-guide-for-programmers-and-other-curio`,
      },
      {
        title: `Sapiens: A Brief History of Humankind`,
        author: `Yuval Noah Harari`,
        link: `https://www.goodreads.com/book/show/23692271-sapiens`,
      },
    ],
    showsList: [
      {
        title: `Rick and Morty`,
        author: `Dan Harmon, Justin Roiland`,
        link: `https://www.imdb.com/title/tt2861424`,
      },
      {
        title: `Breaking Bad`,
        author: ` Vince Gilligan`,
        link: `https://www.imdb.com/title/tt0903747`,
      },
      {
        title: `Love, Death & Robots`,
        author: `Tim Miller`,
        link: `https://www.imdb.com/title/tt9561862/`,
      }

    ],
    movieList: [
      {
        title: `Leon The Professional`,
        author: `Luc Besson`,
        link: `https://www.imdb.com/title/tt0110413/`,
      },
      {
        title: `Into the Wild`,
        author: `Sean Penn`,
        link: `https://www.imdb.com/title/tt0758758`,
      },
      {
        title: `A Clockwork Orange`,
        author: `Stanley Kubrick`,
        link: `https://www.imdb.com/title/tt0066921`,
      },
    ],
  },
  plugins: [
    `gatsby-plugin-preload-link-crossorigin`,
    `gatsby-plugin-catch-links`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: "src",
        path: `${__dirname}/src/`,
      },
    },
    `gatsby-plugin-sass`,
    `gatsby-transformer-remark`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Ahmet Tufan Helvaci's Personal Site`,
        short_name: `Athelvaci`,
        description: `This is my personal site.`,
        start_url: `/`,
        background_color: `#fff`,
        theme_color: `#fff`,
        display: `standalone`,
       // icon: `${__dirname}/static/favicon.ico`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: "gatsby-plugin-google-fonts",
      options: {
        fonts: ["Raleway:300,400"],
        display: "swap",
      },
    },
    {
      resolve: `gatsby-plugin-nprogress`,
      options: {
        color: `tomato`,
        showSpinner: true,
      },
    },
  ],
}
