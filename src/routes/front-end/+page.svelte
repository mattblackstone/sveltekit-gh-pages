<script>
  import { base } from "$app/paths";
</script>

<main>
  <header>
    <div class="right-margin-lrg">
      <h2>Static site front-end for Google Sheets</h2>
    </div>
  </header>
  <section>
    <div>
      <h3>Overview</h3>
      <article class="flex-horiz">
        <div>
          <h5>Motivation</h5>
          <p>
            Automated workflows using custom scripted Google Sheets are extremely effective, but can be overwhelming. A
            well designed front-end view gives much more control over how the data is displayed. This makes the
            aggregate data much more presentable and digestible while still using the Google Sheets as the data source.
            High level decisions like approvals can be made in the front-end.
          </p>
        </div>
      </article>
      <article class="flex-horiz">
        <div>
          <h5>Tech Stack</h5>
          <p>
            Google Sheets was already established as the primary workflow. We chose React for it's ability to render and
            sort long lists efficiently. The site also needed to run in an Amazon S3 environment, so Next.js was good
            fit to generate static pages. The pages would make requests for Google Sheet data using the url query
            string. An AWS Lambda function would format the Google Sheet data and send a JSON response to the page.
            Actions like changes in approval would trigger another Lambda function that would write data back to the
            connected Google Sheet.
          </p>
        </div>
      </article>
      <h3>Screen Recording</h3>
      <article class="flex-horiz">
        <video preload="auto" muted controls src="{base}/video/instagram/ig-demo.mp4" poster="{base}/images/instagram/poster.png" />
      </article>
    </div>
  </section>
</main>

<style lang="scss">
  video {
    width: 100%;
    height: 540px;
  }
</style>