import React, { useContext } from "react"
import { PageLayout, PageTitle } from "../components"
import { Container, Image } from "react-bootstrap"
import { Link, graphql } from "gatsby"
import { ThemeContext, SEO } from "../utils"

export default ({ data }) => {
  const MediaLink = ({ title, author, link }) => (
    <li key={title} style={{ color: "gray" }}>
      <a rel="noopener noreferrer" href={link}>
        {title}
      </a>
      &nbsp;-<i>{author}</i>
    </li>
  )

  const {
    author,
    occupation,
    readingList,
    showsList,
    movieList,
    designations,
    unemployed,
    homeLocation
  } = data.site.siteMetadata
  const { toString } = useContext(ThemeContext)

  const bookLinks = readingList.map(book => MediaLink(book))
  const showLinks = showsList.map(show => MediaLink(show))
  const movieLinks = movieList.map(show => MediaLink(show))

  return (
    <PageLayout>
      <SEO title="About Me"/>
      <PageTitle title="About Me"/>
      <Container>
        <Image
          rounded
          width="140"
          height="140"
          src={`../../icons/luke-${toString()}.png`}
          alt={author}
        />
        <article className="w-75 m-auto pt-2 text-justify">
          <p className="text-center">
            {designations.map((attr, i) => (
              <span key={attr}>
                &nbsp;<b>{attr}</b>&nbsp;
                {i < designations.length - 1 && <>||</>}
              </span>
            ))}
          </p>
          <p className="i-5 mt-4 pt-2">
            Hello there! My name is <b>{`${author}`}</b>. I am a&nbsp;
            <b>{occupation}</b> discovering the ways of the code. I have more than 4 years of experience developing Web
            Apps and Java Back-ends. I am currently living in  <b>{homeLocation}</b>.
          </p>
          <p className="i-5">
            I am coding in Java to build Large Scale Backend Systems and multinational API services. I am also
            interested in Blockchain Technology and keep myself always updated.
          </p>

          <p className="i-5">
            I studied Computer Engineering and I am doing my master on Software Engineering at <a
            href="http://www.boun.edu.tr/en_US"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bogazici University
          </a>.
            &nbsp;
          </p>
          <p className="i-5">
            In my spare times I like to watch movies/series, read books and travel. I like to discover and try new
            technologies.
          </p>

          <p className="i-5">
            Check out my <Link to="/projects">projects</Link> to see what I've
            been up to! Or check out my <Link to="/blog">blog</Link> to see
            what's recently caught my eye!
          </p>
        </article>
        <article className="w-75 m-auto">
          {unemployed && (
            <>
              <hr/>
              <p className="unemployed">
                <small>
                  If you like what you <Link to="/resume">see</Link>, let's get
                  in&nbsp;
                  <a
                    href="mailto:athelvaci@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    touch
                  </a>
                  !
                </small>
              </p>
            </>
          )}
          <hr/>
          <h5 className="watch-list-title pt-4">
            Here are a couple of books from my reading list:
          </h5>
          <ul style={{ fontSize: "0.9rem", listStyle: "none" }}>{bookLinks}</ul>
          <h5 className="watch-list-title pt-4">
            Here are a couple of series from my watch list:
          </h5>
          <ul style={{ fontSize: "0.9rem", listStyle: "none" }}>{showLinks}</ul>
          <h5 className="watch-list-title pt-4">
            Here are a couple of movies from my watch list:
          </h5>
          <ul style={{ fontSize: "0.9rem", listStyle: "none" }}>{movieLinks}</ul>
        </article>
      </Container>
    </PageLayout>
  )
}

export const query = graphql`
  query {
    site {
      siteMetadata {
        unemployed
        occupation
        author
        designations
        homeLocation
        readingList {
          title
          author
          link
        }
        showsList {
          title
          author
          link
        }
        movieList {
          title
          author
          link
        }
      }
    }
  }
`
