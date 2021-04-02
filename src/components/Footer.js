import React from "react"
import { useStaticQuery, graphql } from "gatsby"

export default () => {
  const { author } = useStaticQuery(query).site.siteMetadata
  return (
    <div className="footer text-muted text-center">
      <span className="m-auto">
        <b>{author}</b> &copy; {new Date().getFullYear()}.
      </span>
    </div>
  )
}
const query = graphql`
  query Author {
    site {
      siteMetadata {
        author
      }
    }
  }
`
