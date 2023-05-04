<script>
  /* global TweenMax, Power3 */
  import { base } from "$app/paths";
  import { onMount } from 'svelte';
  const Animation = {
    init: function init() {
      const screens = document.getElementById('screens');
      const frameWidth = 414;
      const frames = 29;
      let frameNum = 0;
      let loops = 0;
      let advance;

      function frameAdvance() {
        frameNum += 1;

        if (frameNum < frames) {
          TweenMax.to(screens, 0.5, {
            backgroundPosition: "-" + frameWidth * frameNum + "px 0px",
            ease: Power3.easeInOut
          });
        } else {
          clearInterval(advance);
          loops += 1;
          frameNum = 0;
          TweenMax.to(screens, 1, {
            backgroundPosition: '0px 0px',
            ease: Power3.easeInOut
          });
          if (loops < 3) TweenMax.delayedCall(2, play);
        }
      }

      function play() {
        advance = setInterval(frameAdvance, 1500);
      }

      play();
    }
  };

  onMount(() => {
    if (window.TweenMax) {
      // cached
      Animation.init();
    }
  });
</script>

<svelte:head>
	<script async src="https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/TweenMax.min.js" on:load={Animation.init}></script>
</svelte:head>


<div id="content">
  <header>
    <div>
      <h1>Strava</h1>
      <h2>2019 &ndash; Year In Sport</h2>
    </div>
  </header>
  <div id="hero-img">
    <div id="slideshow">
      <div id="screens" class="sprite-mov"></div>
    </div>
  </div>
  <section>
    <div>
      <h5>Overview</h5>
      <article>
        <h3>The Situation</h3>
        <p>Strava is a social-fitness community of <a href="https://blog.strava.com/press/strava-releases-2019-year-in-sport-data-report/">millions</a> of athletes from hundreds of countries. Strava athletes range from casual to professional and some can be obsessed with their fitness data. Strava's Year In Sport is something athletes look forward to but is also a valuable recruiting tool via social media shares. The client wanted to avoid the shortcomings of a prior relationship: lack of control/ownership, difficulty with social sharing.</p>
      </article>
      <article>
        <h3>The Plan</h3>
        <p>Create a shareable, interactive experience inclusive of all types of athletes that wouldn't just highlight peak performances. Integrate the experience within the Strava site and collaborate with their developers to give Strava complete ownership.</p>
      </article>
      <article>
        <h3>Prototyping</h3>
        <p>The UI design was done in Figma along with some basic prototypes. The next step was to do more robust prototyping using vanilla JavaScript while decisions regarding the final tech stack were being made. I used the Greensock JS animation library (due to it's compatibility with JS frameworks) and sample JSON data to create prototypes. There was also some early discussion of using device motion sensors, so I handled that as well.<br><a href="{base}/video/strava/strava-gyro-demo.mp4">View gyroscope prototype</a> | <a href="{base}/strava/total-time">View data-vis prototype</a></p>
      </article>
      <article>
        <h3>Final Build</h3>
        <p>The experience was built in React using Contentful CMS. I was able to modify my prototypes to work in React and help other developers build the additional data visualizations. We collaborated closely with the Strava tech team to get the data we needed and to integrate the experience into the Strava site. More info and demo available by request.<br><a href="{base}/video/strava/strava-yis-iphone8-demo.mp4">View screen recording</a></p>
      </article>
    </div>
  </section>
</div>


<style>
header, section {
  display: -ms-flexbox;
  display: flex;
  -ms-flex-direction: row;
      flex-direction: row;
  -ms-flex-pack: justify;
      justify-content: space-between; }

article {
  margin-bottom: 30px; }

header div {
  width: 100%;
  text-align: right; }

#content {
  padding-top: 48px;
  margin: 0 auto;
  width: 768px; }

#slideshow {
  top: 20px;
  left: -108px;
  width: 414px;
  position: absolute;
  perspective: 1500px; }

#screens {
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.25);
  transform-origin: top;
  transform: scale(0.5) rotateY(-11deg); }

#hero-img {
  position: relative;
  overflow: hidden;
  width: 768px;
  height: 468px;
  background-image: url('/images/strava/strava-screens-perspective.png');
  transform-origin: top left; }

@media only screen and (max-width: 840px) {
  section {
    margin: -128px 0 28px; }
  #content {
    padding-top: 32px;
    width: 512px; }
  #hero-img {
    transform: scale(0.66667); } }

@media only screen and (max-width: 548px) {
  section {
    margin: -208px 0 24px; }
  #content {
    padding-top: 24px;
    width: 384px; }
  #hero-img {
    transform: scale(0.5); } }

@media only screen and (max-width: 432px) {
  header {
    margin-bottom: 14px; }
    header div {
      text-align: left; }
  section {
    margin: -250px 0 21px; }
  #content {
    padding-top: 16px;
    width: 320px; }
  #hero-img {
    transform: scale(0.41667); } }

@media only screen and (max-width: 362px) {
  section {
    margin: -290px 0 21px; }
  #content {
    width: 256px; }
  #hero-img {
    transform: scale(0.33333); } }

.sprite-mov {
  background-image: url('/images/strava/sprite.mov.png');
  width: 414px;
  height: 896px; }
/* .sprite-mov.trans-12fps {
  transition: background-position 2.3333s steps(28); }
.sprite-mov.trans-15fps {
  transition: background-position 1.8667s steps(28); }
.sprite-mov.trans-18fps {
  transition: background-position 1.5556s steps(28); }
.sprite-mov.trans-24fps {
  transition: background-position 1.1667s steps(28); }
.sprite-mov.trans-30fps {
  transition: background-position 0.9333s steps(28); }
.sprite-mov.trans-60fps {
  transition: background-position 0.4667s steps(28); }
.sprite-mov.last-frame {
  background-position: -11592px 0px; }
.sprite-mov.first-frame {
  background-position: 0 0; } */

</style>