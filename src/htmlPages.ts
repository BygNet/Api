const styles: string = `
<style>
  body {
    ;margin: 0
    ;padding: 1rem
    ;background: #170023
    ;color: #DCDBDE
  }
  
  * {
    ;font-family: "Wix Madefor Text", sans-serif
  }
  
  a {
    ;color: #D11595
  }
</style>
`

export const HomePage: string = `
<html lang="en">
  <head>
    <title>Byg API Home</title>
    <link rel="icon" href="https://byg.gg/favicon.ico" />
    
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Text:ital,wght@0,400..800;1,400..800&display=swap" rel="stylesheet">
    
    ${styles}
  </head>
  <body>
    <h1>Byg API home.</h1>
    
    <ul>
      <li><a href="https://byg.gg">Byg App for Web.</a></li>
      <li><a href="/swagger">Byg API Swagger.</a></li>
    </ul>
  </body>
</html>
`
