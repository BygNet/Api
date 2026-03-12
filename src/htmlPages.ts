const styles: string = `
<style>
  @import url("https://fonts.googleapis.com/css2?family=Unbounded:wght@200..900&display=swap");
  
  body {
    ;margin: 0
    ;padding: 1rem
    ;background: black
    ;color: #fae6f7
  }
  
  * {
    ;font-family: "Unbounded", sans-serif
  }
  
  a {
    ;color: #ff00dd
  }
</style>
`

export const HomePage: string = `
<html lang="en">
  <head>
    <title>Byg API Home</title>
    <link rel="icon" href="https://byg.a35.dev/favicon.ico" />
    
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${styles}
  </head>
  <body>
    <h1>Byg API home.</h1>
    
    <ul>
      <li><a href="https://byg.a35.dev">Byg App for Web.</a></li>
      <li><a href="/swagger">Byg API Swagger.</a></li>
    </ul>
  </body>
</html>
`
