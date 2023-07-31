<main>
  <header>
    <div class="right-margin-lrg">
      <h1>Samsung</h1>
      <h2>display advertising</h2>
    </div>
  </header>
  <section>
    <div>
      <h3>HTML Canvas</h3>
      <article class="flex-horiz-stack">
        <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-s10/gamers/970x250/index.html">
          <img style="width: 194px; height: 50px;" src="https://mattblackstone.com/digital-advertising/samsung/galaxy-s10/gamers/970x250/backup.jpg" alt="Samsung ad preview" class="thumb" />
        </a>
        <div>
          <h5><strong>Galaxy S10</strong> &ndash; Fortnite</h5>
          <p>
            HTML5 introduced the Canvas element which is meant for direct pixel manipulation using Photoshop-like
            effects. A canvas can have a 2D or 3D drawing context. Animation can be acheived by drawing new images to
            the canvas several times per-second. This example uses a Javascript loop to draw particles to the canvas at
            a rate of 30fps. <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-s10/gamers/970x250/index.html">View ad</a> |
            <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-s10/gamers/970x250/assets.html">assets</a>
          </p>
        </div>
      </article>
      <h3>CSS 3D</h3>
      <article class="flex-horiz">
        <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-fold/kv-fold/300x600/index.html">
          <img style="width: 60px; height: 120px;" src="https://mattblackstone.com/digital-advertising/samsung/galaxy-fold/kv-fold/300x600/backup.jpg" alt="Samsung ad preview" class="thumb" />
        </a>
        <div>
          <h5><strong>Galaxy Fold</strong> &ndash; Launch</h5>
          <p>
            All modern browsers have basic support CSS 3D. It's a bit convoluted to use, but has a tiny footprint
            compared to more robust Javascript 3D libraries. Although not true 3D, a lot can be acheived through careful
            perspective transformations of 2D elements. <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-fold/kv-fold/300x600/index.html">View ad</a> |
            <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-fold/kv-fold/300x600/assets.html">assets</a>
          </p>
        </div>
      </article>
      <h3>After Effects &#43; Lottie</h3>
      <article class="flex-horiz-stack">
        <a href="https://mattblackstone.com/digital-advertising/samsung/ugtg/screen/970x250/index.html">
          <img style="width: 194px; height: 50px;" src="https://mattblackstone.com/digital-advertising/samsung/ugtg/screen/970x250/backup.png" alt="Samsung ad preview" class="thumb" />
        </a>
        <div>
          <h5><strong>Galaxy</strong> &ndash; Upgrade to Galaxy</h5>
          <p>
            <a href="https://airbnb.io/lottie/">Lottie</a> is only a few years old but is gaining in popularity. After
            installing a plugin called <a href="https://aescripts.com/bodymovin/">Bodymovin</a> in After Effects,
            animations can be output to a JSON format which can be played back natively on mobile and in a browser using
            the <a href="https://cdnjs.com/libraries/bodymovin">Lottie JS library</a>. Even though Lottie only supports
            a subset of After Effects features (works best with vector content, no Expressions or fancy effects), it
            allows for very high quality animations that compress very well. Lottie animations also allow playback
            control and dispatch events. <a href="https://mattblackstone.com/digital-advertising/samsung/ugtg/screen/970x250/index.html">View ad</a>
          </p>
        </div>
      </article>
      <h3>Sprite Animation</h3>
      <article class="flex-horiz">
        <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-s6/butterfly/index.html">
          <img style="width: 60px; height: 120px;" src="https://mattblackstone.com/digital-advertising/samsung/galaxy-s6/butterfly/backup.jpg" alt="Samsung ad preview" class="thumb" />
        </a>
        <div>
          <h5><strong>Galaxy S6</strong> &ndash; Launch</h5>
          <p>
            Sprite is a generic term for a small bitmap image (usually one of many images stitched together into one
            large image for better performance). This example uses image sequences stiched together into long strips
            that give the illusion of motion like a film strip. This setup provides granular control for playing
            animations forward or in reverse or dynamically changing the frames per-second. 
            <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-s6/butterfly/index.html">View ad</a>
            | <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-s6/butterfly/assets.html">assets</a>
          </p>
        </div>
      </article>
      <h3>Interactive Video</h3>
      <article class="flex-horiz-stack">
        <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-fold/masthead-features/index.html">
          <img style="width: 194px; height: 50px;" src="https://mattblackstone.com/digital-advertising/samsung/galaxy-fold/masthead-features/backup.jpg" alt="Samsung ad preview" class="thumb" />
        </a>
        <div>
          <h5><strong>Galaxy Fold</strong> &ndash; NYTimes Masthead</h5>
          <p>
            Ads containing video must be run on a rich media platform such as Google's DoubleClick Studio. This ad
            features a 'draggable' video that spawns smaller videos based on user interaction. 
            <a href="https://mattblackstone.com/digital-advertising/samsung/galaxy-fold/masthead-features/index.html">View ad</a>
          </p>
        </div>
      </article>
      <a href="http://mattblackstone.com/digital-advertising/more.html">More ad examples</a>
    </div>
  </section>
</main>

<style lang="scss">
  header, section, .flex-horiz, .flex-horiz-stack {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  
  .thumb {
    margin: 0 18px 0 0;
    padding: 0;
    border: none;
    max-width: unset;
  }

  @media only screen and (max-width: 568px) {
    header, section, .flex-horiz-stack {
      flex-direction: column;
    }

    .flex-horiz-stack .thumb {
      margin: 0 0 14px 0;
    }
  }
</style>
