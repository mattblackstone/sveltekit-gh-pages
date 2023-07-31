<script>
  /* global TweenMax, TimelineMax, Back, Power2, Power3 */
  import { base } from "$app/paths";
  import { onMount, tick } from 'svelte';
  function domIds(scope) {
    if (scope === void 0) {
      scope = document;
    }

    var all = scope.getElementsByTagName("*");
    var haveIds = {};
    var i = all.length;

    while (i--) {
      if (all[i].id) {
        var safeId = all[i].id.replace(/-|:|\./g, "_");
        haveIds[safeId] = all[i];
      }
    }

    return haveIds;
  }

  var CompareView = {
    init: function init() {
      var pointer = {
        x: 10,
        y: 10,
        type: null,
        ratioX: 0.5,
        ratioY: 0.5,
      };
      var pointerEvt = new CustomEvent("pointerupdate", {
        detail: {
          pointer: pointer,
        },
      });
      var origin = {
        get gamma() {
          return this.g;
        },

        set gamma(g) {
          if (!this.g) this.g = g;
        },

        get beta() {
          return this.b;
        },

        set beta(b) {
          if (!this.b) this.b = b;
        },
      };
      var dom = domIds();
      var maRect = dom.main_area.getBoundingClientRect();
      var aspectRatio = maRect.width / maRect.height;
      var orientation = aspectRatio > 1 ? "landscape" : "portrait";
      var gyro = true;
      var permission = null;
      var midSnap = true;
      var gamma = 0; // x

      var beta = 0; // y

      window.console.log(maRect);

      function setPointer(x, y, type) {
        var midY = maRect.height * 0.5;
        var xx = x - maRect.left; // TODO: same as yy

        var yy = y - (maRect.top + midY);
        var ratioY = yy / midY;
        if (ratioY < -0.1 || ratioY > 0.1) yy *= 0.9 + Math.abs(ratioY);

        if (yy < -midY) {
          yy = -midY;
          midSnap = false;
        }

        if (yy > midY) {
          yy = midY;
          midSnap = false;
        }

        if (midSnap && Math.abs(yy) < 40) yy = 0; // snap to middle

        pointer.x = xx;
        pointer.y = yy + midY;
        pointer.type = type;
        pointer.ratioX = pointer.x / maRect.width;
        pointer.ratioY = pointer.y / maRect.height;
        window.dispatchEvent(pointerEvt);
      }

      function userTilt(e) {
        origin.gamma = e.gamma;
        gamma += e.gamma - origin.gamma;
        if (gamma > maRect.width) gamma = maRect.width;
        if (gamma < maRect.left) gamma = maRect.left;
        origin.beta = e.beta;
        beta += e.beta - origin.beta;
        if (beta > maRect.height + maRect.top)
          beta = maRect.height + maRect.top;
        if (beta < maRect.top) beta = maRect.top;
        setPointer(gamma, beta, "gyro");
      }

      function startTilt() {
        origin.g = null;
        origin.b = null;
        gamma = pointer.x || maRect.width / 2;
        beta = pointer.y + maRect.top || maRect.height / 2 + maRect.top;
        window.addEventListener("deviceorientation", userTilt, false);
      }

      function mouseMove(e) {
        e.preventDefault();
        setPointer(e.pageX, e.pageY, "mouse");
      }

      function touchMove(e) {
        e.preventDefault();
        setPointer(
          e.changedTouches[0].pageX,
          e.changedTouches[0].pageY,
          "touch"
        );
      }

      function startSwipe(e) {
        if (gyro)
          window.removeEventListener("deviceorientation", userTilt, false);
        touchMove(e);
        dom.main_area.addEventListener("touchmove", touchMove, false);
      }

      function endSwipe() {
        if (gyro) startTilt();
        dom.main_area.removeEventListener("touchmove", touchMove, false);
      }

      var listening;

      function gyroAccess(callback) {
        // only call when page loads
        setPointer(
          maRect.width * 0.5 + maRect.left,
          maRect.height * 0.5 + maRect.top
        );
        dom.main_content.classList.remove("invisible");

        if (
          !/gyro/i.test(window.location.hash) &&
          permission === null &&
          window.location.protocol === "https:" &&
          typeof DeviceOrientationEvent !== "undefined" &&
          typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
          dom.allow.addEventListener("click", function () {
            DeviceOrientationEvent.requestPermission().then(function (
              response
            ) {
              // dom.nav_gyro.classList.remove('none');
              dom.test.innerHTML = response;
              window.location.hash = "gyro";
              permission = true;
              TweenMax.to(dom.test, 1.5, {
                delay: 0.5,
                autoAlpha: 0,
              });
              gyro = true;
              callback();
            });
            dom.permission.classList.add("none");
          });
          dom.deny.addEventListener("click", function () {
            window.location.hash = "nogyro";
            permission = false;
            dom.permission.classList.add("none");
            gyro = false;
            callback();
          });
          dom.permission.classList.remove("none");
        } else {
          if (window.location.hash === "#gyro") {
            gyro = true;
            dom.test.innerHTML = "gyro on";
          }

          if (window.location.hash === "#nogyro") {
            gyro = false;
            dom.nav_gyro.classList.add("disabled");
            dom.test.innerHTML = "gyro off";
          }

          TweenMax.to(dom.test, 1.5, {
            delay: 0.5,
            autoAlpha: 0,
          });
          callback();
        }
      }

      function toggleGyro() {
        gyro = !gyro;

        if (gyro) {
          startTilt();
          dom.nav_gyro.classList.remove("disabled");
        } else {
          window.removeEventListener("deviceorientation", userTilt, false);
          dom.nav_gyro.classList.add("disabled");
        }
      }

      function firstTilt() {
        dom.nav_gyro.addEventListener("click", toggleGyro);
        dom.nav_gyro.classList.remove("none");
        window.removeEventListener("deviceorientation", firstTilt);
      }

      function initListeners() {
        if (!listening) {
          dom.toggle_a.addEventListener("click", function () {
            window.console.log("toggle_a click");
          });
          dom.toggle_b.addEventListener("click", function () {
            window.console.log("toggle_b click");
          }); // dom.nav_gyro.addEventListener('click', toggleGyro);

          window.addEventListener("deviceorientation", firstTilt, false);
          dom.main_area.addEventListener("mousemove", mouseMove, false);
          dom.main_area.addEventListener("touchstart", startSwipe, false);
          dom.main_area.addEventListener("touchend", endSwipe, false);
          dom.main_area.addEventListener("touchcancel", endSwipe, false);
          if (gyro) startTilt();
          window.addEventListener("resize", function () {
            maRect = dom.main_area.getBoundingClientRect();
            aspectRatio = maRect.width / maRect.height;
            orientation = aspectRatio > 1 ? "landscape" : "portrait";
            dom.test.innerHTML = orientation;
            TweenMax.fromTo(
              dom.test,
              1.5,
              {
                autoAlpha: 1,
              },
              {
                delay: 0.5,
                autoAlpha: 0,
              }
            );
          });
          listening = true;
        }
      } // //////////////////////////////////////////////////// INIT //////////////////////////////////////////////////////

      gyroAccess(initListeners);
    },
  };

  var ActivityIcons = {
    Ride: "bike",
    Run: "run",
    Swim: "water",
    Hike: "hike",
    Walk: "walk",
    AlpineSki: "ski",
    BackcountrySki: "ski",
    Canoeing: "kayaking",
    Crossfit: "other",
    EBikeRide: "e_bike",
    Elliptical: "other",
    Handcycle: "handcycle",
    IceSkate: "ice_skate",
    InlineSkate: "inline_skate",
    Kayaking: "kayaking",
    Kitesurf: "kitesurf",
    NordicSki: "ski",
    RockClimbing: "rock_climbing",
    RollerSki: "ski",
    Rowing: "rowing",
    Snowboard: "snowboard",
    Snowshoe: "snowshoe",
    StairStepper: "other",
    StandUpPaddling: "stand_up_paddling",
    Surfing: "surfing",
    Velomobile: "velomobile",
    VirtualRide: "bike",
    VirtualRun: "other",
    WeightTraining: "weight_training",
    Wheelchair: "wheelchair",
    Windsurf: "windsurf",
    Workout: "other",
    Yoga: "yoga",
  };

  var Animation = {
    init: async function init() {
      await tick();
      var dom = domIds();
      var names = [
        "athlete-01",
        "athlete-02",
        "athlete-03",
        "athlete-04",
        "athlete-05",
        "athlete-06",
        "athlete-07",
      ];
      var name = Math.floor(Math.random() * names.length);
      var athleteURL = base + "/data/strava/" + names[name] + ".json";
      var athleteReq = new XMLHttpRequest();
      var timeDisplay = {
        units: 0,
      };
      var animationA = new TimelineMax({
        paused: true,
      });
      var animationB = new TimelineMax({
        paused: true,
      });
      var pointer;
      var yisData;
      var totalTime = 0;
      var timeUnits;
      var timeDivisor;
      var topActivities;
      var digits; // let rx;
      // let ry;

      function updateTimeText() {
        var units = Math.round(timeDisplay.units).toString();

        while (units.length < digits) {
          units = "0" + units;
        }

        dom.time_text.innerHTML = units;
      }

      window.addEventListener("pointerupdate", function (e) {
        pointer = e.detail.pointer;
        TweenMax.set("#mask_b", {
          y: pointer.y,
        });
        TweenMax.set("#content_b", {
          y: -pointer.y,
        }); // rx = -10 * (pointer.ratioY - 0.5);
        // ry = 10 * (pointer.ratioX - 0.5);
        // TweenMax.set('#parallax', { rotationX: rx, rotationY: ry });

        if (pointer.type) {
          if (pointer.ratioY > 0.5) {
            animationA.seek(
              (animationA.totalDuration() * (pointer.ratioY - 0.5)) / 0.5
            );
            updateTimeText();
            animationB.seek(0);
          }

          if (pointer.ratioY === 0.5) {
            animationA.seek(0);
            updateTimeText();
            animationB.seek(0);
          }

          if (pointer.ratioY < 0.5) {
            animationB.seek(
              animationB.totalDuration() * (1 - pointer.ratioY * 2)
            );
            animationA.seek(0);
          }
        }
      });
      CompareView.init(); // after pointerupdate listener

      athleteReq.open("GET", athleteURL);
      athleteReq.responseType = "json";
      athleteReq.send();

      athleteReq.onload = function () {
        yisData = athleteReq.response;
        totalTime = yisData.timeByActivityType.totalSeconds;
        timeUnits = totalTime < 540000 ? "min" : "hrs"; // max 9000 mins

        timeDivisor = timeUnits === "min" ? 60 : 3600;
        var totalUnits = totalTime / timeDivisor;
        dom.time_units.innerHTML = timeUnits.toUpperCase();
        animationA.to(
          dom.time_ring,
          5,
          {
            strokeDashoffset: 0,
            ease: Power3.easeInOut,
          },
          0
        );
        digits = Math.round(totalUnits).toString().length;
        animationA.to(
          timeDisplay,
          5,
          {
            units: totalUnits,
            ease: Power3.easeInOut,
          },
          0
        );
        animationA.from(dom.title_a, 0.5, {
          x: -30,
          opacity: 0,
          ease: Power3.easeOut,
        });
        topActivities = yisData.timeByActivityType.byActivityType;
        topActivities.sort(function (a, b) {
          return a.seconds < b.seconds ? 1 : -1;
        });
        window.console.log(
          "total time for " + names[name] + ": " + totalUnits + " " + timeUnits
        );
        var ringRatios = [1, 0.8, 0.6, 0.4, 0.2];
        var iconThemes = ["light", "light", "light", "normal", "normal"];
        var range = 0;
        topActivities.splice(ringRatios.length); // truncate

        topActivities.forEach(function (activity, i) {
          topActivities[i].icon =
            ActivityIcons[activity.activityType] || "other";
          topActivities[i].units = activity.seconds / timeDivisor;
          topActivities[i].ringRelative = activity.units / ringRatios[i];
          range = Math.max(range, activity.ringRelative);
        });
        range = Math.ceil(range * 1.1); // no full rings

        window.console.log(topActivities, dom.rings);
        var midpoint = Math.round(dom.rings.getAttribute("width") * 0.5);
        var ringOffset = 12; // half-width of ring icons

        var pi2 = Math.PI * 2;
        topActivities.forEach(function (activity, i) {
          var rad = midpoint * ringRatios[i] - ringOffset;
          var ratio = activity.ringRelative / range;
          var arc = pi2 * rad; // const dash = ratio * arc;

          var gap = arc - ratio * arc; // window.console.log(`rad: ${rad}, ratio: ${ratio}, arc: ${arc}`);

          var circ = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          circ.setAttribute("cx", midpoint);
          circ.setAttribute("cy", midpoint);
          circ.setAttribute("r", rad);
          circ.setAttribute("class", "circ");
          dom.rings.appendChild(circ);
          var ring = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          ring.setAttribute("id", "ring" + i);
          ring.setAttribute("cx", midpoint);
          ring.setAttribute("cy", midpoint);
          ring.setAttribute("r", rad);
          ring.setAttribute("class", "ring");
          ring.setAttribute("stroke-dasharray", arc + " " + arc); // static [dash, gap]

          ring.setAttribute("stroke-dashoffset", "" + arc); // start at 0

          dom.rings.appendChild(ring);
          var type = topActivities[i].activityType;
          var units = topActivities[i].units;
          var iconCirc = document.createElement("div");
          var iconSprite = document.createElement("div");
          iconCirc.setAttribute("id", "icon" + i);
          iconCirc.style.top = Math.round(midpoint - rad - ringOffset) + "px";
          iconCirc.classList.add("icon-circ");
          iconSprite.classList.add("sprite-svg");
          iconSprite.classList.add(
            "sports_" + topActivities[i].icon + "_" + iconThemes[i] + "_xsmall"
          );
          iconCirc.appendChild(iconSprite);
          dom.icons.appendChild(iconCirc);
          var sport = document.createElement("div");
          var sportName = document.createElement("div");
          var sportDot = document.createElement("div");
          var sportTime = document.createElement("div");
          sportName.innerHTML = "" + type.toUpperCase();
          sportName.classList.add("sport-name");
          sportDot.id = "dot" + i;
          sportDot.classList.add("sport-dot");
          sportTime.innerHTML =
            Math.round(units) + " <span>" + timeUnits + "</span>";
          sportTime.classList.add("sport-time");
          sport.appendChild(sportName);
          sport.appendChild(sportDot);
          sport.appendChild(sportTime);
          dom.sports.appendChild(sport);
          animationB.from(
            sport,
            0.5,
            {
              x: -30,
              opacity: 0,
              ease: Power3.easeOut,
            },
            i * 0.1 + 0.5
          );
          animationB.from(
            iconCirc,
            0.5,
            {
              scale: 0,
              ease: Back.easeOut,
            },
            i * 0.2 + 4
          );
          animationB.to(
            ring,
            3.5,
            {
              strokeDashoffset: gap,
              ease: Power2.easeOut,
            },
            i * 0.2 + 4.5
          );
        });

        if (topActivities.length === 1) {
          var iconSpriteLrg = document.createElement("div");
          iconSpriteLrg.classList.add("sprite-svg");
          iconSpriteLrg.classList.add(
            "sports_" + topActivities[0].icon + "_" + iconThemes[0] + "_large"
          );
          var iconBig = document.createElement("div");
          iconBig.id = "icon_big";
          iconBig.appendChild(iconSpriteLrg);
          dom.icons.appendChild(iconBig);
          animationB.from(
            iconBig,
            0.5,
            {
              scale: 0,
              ease: Back.easeOut,
            },
            0.5
          );
        }

        animationB.from(dom.title_b, 0.5, {
          x: -30,
          opacity: 0,
          ease: Power3.easeOut,
        });
      };
    },
  };

  onMount(() => {
    if (window.TweenMax) {
      // cached
      Animation.init();
    }
  });
</script>

<svelte:head>
  <script
    async
    src="https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/TweenMax.min.js"
    on:load={Animation.init}
  ></script>
</svelte:head>

<main>
  <div id="nav">
    <div id="header">
      <div id="nav_menu" class="nav-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3 5H21V6H3V5ZM3 11H21V12H3V11ZM21 17H3V18H21V17Z"
            fill="#FC5200"
          />
        </svg>
      </div>
      <div id="nav_gyro" class="nav-icon none">
        <svg
          height="25"
          viewBox="0 0 25 25"
          width="25"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g fill="none" stroke="#000">
            <circle cx="12.5" cy="12.5" r="12" />
            <circle cx="12.5" cy="12.5" r="1" />
            <path
              d="m306.5 83.5c2.209 0 4 4.477 4 10s-1.791 10-4 10-4-4.477-4-10 1.791-10 4-10z"
              transform="translate(-294 -81)"
            />
            <path
              d="m306.5 89.5c5.523 0 10 1.791 10 4s-4.477 4-10 4-10-1.791-10-4 4.477-4 10-4z"
              transform="translate(-294 -81)"
            />
            <circle cx="23" cy="2" r="1.5" />
            <circle cx="2" cy="23" r="1.5" />
          </g>
        </svg>
      </div>
      <div id="nav_share" class="nav-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M18 15.9998C17.0802 16.0058 16.2141 16.4333 15.65 17.1598L7.82997 12.9998C8.05729 12.3834 8.05729 11.7061 7.82997 11.0898L15.65 6.87977C16.5589 8.02514 18.1612 8.34839 19.4431 7.64501C20.725 6.94164 21.313 5.41655 20.8352 4.03462C20.3575 2.6527 18.953 1.81653 17.5104 2.05513C16.0678 2.29373 15.0074 3.5376 15 4.99977C14.9995 5.34034 15.057 5.67851 15.17 5.99977L7.34997 10.1598C6.56508 9.14461 5.22144 8.74106 4.0071 9.15576C2.79276 9.57045 1.97662 10.7116 1.97662 11.9948C1.97662 13.278 2.79276 14.4191 4.0071 14.8338C5.22144 15.2485 6.56508 14.8449 7.34997 13.8298L15.17 17.9998C15.057 18.321 14.9995 18.6592 15 18.9998C15 20.6566 16.3431 21.9998 18 21.9998C19.6568 21.9998 21 20.6566 21 18.9998C21 17.3429 19.6568 15.9998 18 15.9998ZM18 2.99977C19.1045 2.99977 20 3.8952 20 4.99977C20 6.10434 19.1045 6.99977 18 6.99977C16.8954 6.99977 16 6.10434 16 4.99977C16 3.8952 16.8954 2.99977 18 2.99977ZM4.99997 13.9998C3.8954 13.9998 2.99997 13.1043 2.99997 11.9998C2.99997 10.8952 3.8954 9.99977 4.99997 9.99977C6.10454 9.99977 6.99997 10.8952 6.99997 11.9998C6.99997 13.1043 6.10454 13.9998 4.99997 13.9998ZM18 20.9998C16.8954 20.9998 16 20.1043 16 18.9998C16 17.8952 16.8954 16.9998 18 16.9998C19.1045 16.9998 20 17.8952 20 18.9998C20 20.1043 19.1045 20.9998 18 20.9998Z"
            fill="#6D6D78"
          />
        </svg>
      </div>
    </div>
    <div id="progress">
      <div id="progress_mark" />
    </div>
  </div>
  <div id="toggle_a">
    <div class="arrow">
      <svg
        width="15"
        height="8"
        viewBox="0 0 15 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M1.48599 0.248081C1.61787 0.24996 1.74367 0.303874 1.83599 0.398081L7.98598 6.53808L14.136 0.398082C14.2628 0.271253 14.4477 0.22172 14.6209 0.268143C14.7942 0.314566 14.9295 0.449891 14.9759 0.623143C15.0223 0.796395 14.9728 0.981253 14.846 1.10808L8.34598 7.60808C8.2521 7.70274 8.1243 7.75598 7.99098 7.75598C7.85767 7.75598 7.72987 7.70274 7.63598 7.60808L1.13599 1.10808C0.995926 0.965231 0.954498 0.752645 1.03067 0.567657C1.10684 0.382668 1.28595 0.260891 1.48599 0.258081L1.48599 0.248081Z"
          fill="#494950"
        />
      </svg>
    </div>
    TOTAL TIME
  </div>
  <div id="toggle_b">
    <div class="arrow">
      <svg
        width="15"
        height="9"
        viewBox="0 0 15 9"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M14.5 8.50009C14.3681 8.49821 14.2423 8.44429 14.15 8.35009L7.99998 2.21009L1.84998 8.35009C1.72315 8.47692 1.53829 8.52645 1.36504 8.48003C1.19179 8.4336 1.05646 8.29828 1.01004 8.12503C0.963615 7.95177 1.01315 7.76692 1.13998 7.64009L7.63998 1.14009C7.73386 1.04543 7.86166 0.992188 7.99498 0.992188C8.1283 0.992188 8.25609 1.04543 8.34998 1.14009L14.85 7.64009C14.99 7.78294 15.0315 7.99552 14.9553 8.18051C14.8791 8.3655 14.7 8.48728 14.5 8.49009V8.50009Z"
          fill="white"
        />
      </svg>
    </div>
    TOTAL TIME BY SPORT
  </div>
  <div id="main_content" class="invisible">
    <div id="parallax">
      <div id="mask_a">
        <div id="content_a">
          <div class="container">
            <div class="cell primary">
              <div id="visual_a">
                <svg
                  id="stopwatch"
                  width="308"
                  height="346"
                  viewBox="0 0 308 346"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <style type="text/css">
                    .st0 {
                      fill: #ffffff;
                    }

                    .st1 {
                      fill: none;
                      stroke: #dfdfe8;
                      stroke-width: 6;
                      stroke-dasharray: 2, 26;
                    }

                    .st2 {
                      fill: none;
                      stroke: #dfdfe8;
                      stroke-width: 8;
                    }

                    .st3 {
                      fill: none;
                      stroke: #fc5200;
                      stroke-width: 8;
                      stroke-dasharray: 754, 754;
                      stroke-dashoffset: 754;
                      transform-origin: 154px 192px;
                      transform: rotate(-90deg);
                    }
                  </style>
                  <rect
                    id="top_btn"
                    x="120.9"
                    class="st0"
                    width="66.2"
                    height="34.3"
                  />
                  <rect
                    x="53.7"
                    y="48"
                    transform="matrix(0.8001 -0.5998 0.5998 0.8001 -22.8183 52.2661)"
                    class="st0"
                    width="26.6"
                    height="24.7"
                  />
                  <rect
                    x="228.7"
                    y="47.1"
                    transform="matrix(0.5998 -0.8001 0.8001 0.5998 48.1279 216.9754)"
                    class="st0"
                    width="24.7"
                    height="26.6"
                  />
                  <rect
                    x="135.2"
                    y="34.3"
                    class="st0"
                    width="37.6"
                    height="27"
                  />
                  <circle class="st0" cx="154" cy="192" r="154" />
                  <circle class="st1" cx="154" cy="192" r="138" />
                  <circle class="st2" cx="154" cy="192" r="120" />
                  <circle
                    id="time_ring"
                    class="st3"
                    cx="154"
                    cy="192"
                    r="120"
                  />
                </svg>
                <div id="total_time">
                  <div id="time_text" />
                  <div id="time_units" />
                </div>
              </div>
            </div>
          </div>
          <div class="container">
            <div class="cell secondary" />
            <div class="cell primary" />
            <div class="cell secondary" style="justify-content: flex-end;">
              <div id="title_a">Time well-spent breaking a sweat.</div>
            </div>
          </div>
        </div>
      </div>
      <div id="mask_b">
        <div id="content_b">
          <div class="container">
            <div class="cell primary">
              <div id="visual_b">
                <svg
                  id="rings"
                  width="312"
                  height="312"
                  xmlns="http://www.w3.org/2000/svg"
                />
                <div id="icons" />
              </div>
            </div>
          </div>
          <div class="container">
            <div class="cell secondary" style="justify-content: flex-start;">
              <div id="title_b">How you broke it down.</div>
            </div>
            <div class="cell primary" />
            <div class="cell secondary" style="justify-content: flex-end;">
              <div id="sports" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div id="main_area" />
  <div id="permission" class="none">
    <div>
      <h3>Allow gyroscope access?</h3>
      <button id="allow" class="btn-permission">Allow</button>
      <button id="deny" class="btn-permission">Deny</button>
    </div>
  </div>
  <a
    href="{base}/strava/elevation"
    onclick="location.href=this.href+window.location.hash;return false;"
  >
    <div class="btn-next">
      <div class="sprite-svg arw-right" />
    </div>
  </a>
  <pre id="test" />
</main>

<style lang="scss" global>
  body {
    overflow: hidden;
  }
  
  main {
    padding: 0;
    margin: 0;
    user-select: none;
    font-size: 1em;
  }

  *,
  *:before,
  *:after {
    box-sizing: border-box;
  }

  .invisible {
    visibility: hidden;
  }

  .none {
    display: none !important;
  }

  @font-face {
    font-family: "MaisonNeue";
    src: url("/fonts/MaisonNeue-Book.woff2") format("woff2");
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: "MaisonNeue";
    src: url("/fonts/MaisonNeue-Demi.woff2") format("woff2");
    font-weight: 600;
    font-style: normal;
  }

  @font-face {
    font-family: "MaisonNeue";
    src: url("/fonts/MaisonNeue-Bold.woff2") format("woff2");
    font-weight: 700;
    font-style: normal;
  }

  @font-face {
    font-family: "MaisonNeueExtended";
    src: url("/fonts/MaisonNeueExtended-Demi.woff2") format("woff2");
    font-weight: 600;
    font-style: normal;
  }

  @font-face {
    font-family: "MaisonNeueExtended";
    src: url("/fonts/MaisonNeueExtended-Bold.woff2") format("woff2");
    font-weight: 700;
    font-style: normal;
  }

  @font-face {
    font-family: "MaisonNeueExtended";
    src: url("/fonts/MaisonNeueExtended-ExtraBold.woff2") format("woff2");
    font-weight: 800;
    font-style: normal;
  }

  main {
    font-family: "MaisonNeue", "Segoe UI", "Helvetica Neue", -apple-system,
      system-ui, BlinkMacSystemFont, Roboto, Arial, sans-serif;
    font-weight: 400;
    line-height: 1.125;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .container {
    position: absolute;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-direction: column;
    flex-direction: column;
    -ms-flex-align: center;
    align-items: center;
    -ms-flex-pack: justify;
    justify-content: space-between;
    width: 100%;
    height: 100%;
  }

  .cell {
    display: -ms-flexbox;
    display: flex;
    -ms-flex-direction: column;
    flex-direction: column;
    -ms-flex-pack: center;
    justify-content: center;
  }

  .primary {
    -ms-flex: auto;
    flex: auto;
  }

  #nav {
    position: absolute;
    background: white;
    top: 0;
    left: 0;
    width: 100%;
    height: 52px;
  }
  #nav #header {
    width: 100%;
    height: 100%;
  }
  #nav #header #nav_menu {
    left: 20px;
  }
  #nav #header #nav_gyro {
    right: 60px;
  }
  #nav #header #nav_share {
    right: 20px;
  }
  #nav #header .nav-icon {
    position: absolute;
    top: 12px;
    width: 24px;
    height: 24px;
  }
  #nav #progress {
    position: absolute;
    background: #dfdfe8;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 4px;
  }
  #nav #progress #progress_mark {
    background: #fc5200;
    width: 7%;
    height: 100%;
  }

  .disabled {
    opacity: 0.25;
  }

  #permission {
    background: rgba(0, 0, 0, 0.9);
    text-align: center;
    padding: 18px;
    display: -ms-flexbox;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  #permission h3 {
    margin: 0 0 12px;
    color: white;
    font-family: "MaisonNeue", "Segoe UI", "Helvetica Neue", -apple-system,
      system-ui, BlinkMacSystemFont, Roboto, Arial, sans-serif;
    font-weight: 600;
    font-size: 20px;
  }
  #permission .btn-permission {
    margin: 10px;
    height: 40px;
    width: 120px;
    background-color: #fc5200;
    border: none;
    border-radius: 5px;
    color: white;
    font-family: "MaisonNeue", "Segoe UI", "Helvetica Neue", -apple-system,
      system-ui, BlinkMacSystemFont, Roboto, Arial, sans-serif;
    font-weight: 400;
    font-size: 14px;
  }

  #toggle_a,
  #toggle_b {
    position: absolute;
    left: 0;
    width: 100%;
    height: 36px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    line-height: 36px;
    cursor: pointer;
  }
  #toggle_a .arrow,
  #toggle_b .arrow {
    position: absolute;
    left: 0;
    top: 0;
    width: 36px;
    height: 36px;
  }

  #toggle_a {
    top: 52px;
    color: black;
    background-color: #f0f0f5;
  }

  #toggle_b {
    bottom: 0;
    color: white;
    background-color: black;
  }

  #main_content {
    perspective: 500px;
    background-color: #777;
  }

  #main_area {
    box-sizing: border-box;
    cursor: pointer;
  }

  .btn-next,
  .btn-prev {
    width: 50px;
    height: 50px;
    position: absolute;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-align: center;
    align-items: center;
    -ms-flex-pack: center;
    justify-content: center;
    top: calc(50% + 26px);
    transform: translate(0, -50%);
    transition: all 250ms ease-in-out;
    cursor: pointer;
  }

  .btn-prev {
    left: 0;
  }
  .btn-prev:hover {
    transform: translate(-5px, -50%);
  }

  .btn-next {
    right: 0;
  }
  .btn-next:hover {
    transform: translate(5px, -50%);
  }

  #main_content,
  #main_area,
  #permission {
    position: absolute;
    overflow: hidden;
    top: 88px;
    left: 0;
    width: 100%;
    height: calc(100% - 124px);
  }

  #parallax {
    width: 100%;
    height: 100%;
  }

  #mask_a,
  #mask_b {
    position: absolute;
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
  }

  #mask_a {
    background-color: #f0f0f5;
  }

  #mask_b {
    background-color: black;
  }

  #content_a {
    color: black;
    background-color: #f0f0f5;
    width: 100%;
    height: 100%;
  }

  #content_b {
    color: white;
    background-color: black;
    width: 100%;
    height: 100%;
  }

  #visual_a {
    width: 308px;
    height: 346px;
    margin: auto;
  }
  #visual_a svg {
    position: absolute;
    transform: translateY(-19px);
  }
  #visual_a #total_time {
    position: absolute;
    width: 308px;
    height: 346px;
    text-align: center;
  }
  #visual_a #total_time #time_text {
    position: absolute;
    top: 140px;
    width: 100%;
    font-family: "MaisonNeueExtended", "Arial Black", sans-serif;
    font-weight: 800;
    font-size: 56px;
    line-height: 1;
  }
  #visual_a #total_time #time_units {
    position: absolute;
    top: 200px;
    width: 100%;
    font-size: 24px;
    letter-spacing: 0.125em;
  }

  #sports {
    margin: 0;
    padding: 0;
    font-size: 16px;
    line-height: 1.5em;
    width: 100%;
    display: table;
  }
  #sports > div {
    max-width: 336px;
    display: table-row;
  }
  #sports > div > div {
    display: table-cell;
    white-space: nowrap;
  }
  #sports > div .sport-name {
    text-align: right;
    padding-right: 0.5em;
  }
  #sports > div .sport-dot {
    width: 0.5em;
  }
  #sports > div .sport-dot:before {
    content: "\2022";
    font-weight: bold;
    font-size: 2em;
    line-height: 0.5em;
    vertical-align: middle;
  }
  #sports > div .sport-time {
    font-family: "MaisonNeueExtended", "Arial Black", sans-serif;
    text-align: left;
    padding-left: 0.5em;
  }
  #sports > div .sport-time span {
    font-family: "MaisonNeue", "Segoe UI", "Helvetica Neue", -apple-system,
      system-ui, BlinkMacSystemFont, Roboto, Arial, sans-serif;
  }
  #sports > div #dot0 {
    color: #fc5200;
  }
  #sports > div #dot1 {
    color: #ffb084;
  }
  #sports > div #dot2 {
    color: #1f63f3;
  }
  #sports > div #dot3 {
    color: #bfbfc8;
  }
  #sports > div #dot4 {
    color: white;
  }

  #visual_b {
    width: 312px;
    height: 312px;
    margin: auto;
  }
  #visual_b #rings {
    position: absolute;
    transform: rotateZ(-90deg) rotateX(180deg);
    transform-origin: 50% 50%;
  }
  #visual_b #rings #ring0 {
    stroke: #fc5200;
  }
  #visual_b #rings #ring1 {
    stroke: #ffb084;
  }
  #visual_b #rings #ring2 {
    stroke: #1f63f3;
  }
  #visual_b #rings #ring3 {
    stroke: #bfbfc8;
  }
  #visual_b #rings #ring4 {
    stroke: white;
  }
  #visual_b .circ {
    fill: transparent;
    stroke: white;
    stroke-width: 1px;
  }
  #visual_b .ring {
    transform-origin: 50% 50%;
    fill: transparent;
    stroke-width: 8px;
    stroke-linecap: butt;
  }

  #icons {
    position: absolute;
    transform: translateZ(0);
    width: 312px;
    height: 312px;
    .icon-circ {
      position: absolute;
      width: 24px;
      height: 24px;
      padding: 4px;
      border-radius: 50%;
      left: 50%;
      margin-left: -12px;
    }
    .icon-circ .sprite-svg {
      overflow: hidden;
    }
    #icon0 {
      background-color: #fc5200;
    }
    #icon1 {
      background-color: #ffb084;
    }
    #icon2 {
      background-color: #1f63f3;
    }
    #icon3 {
      background-color: #bfbfc8;
    }
    #icon4 {
      background-color: white;
    }
    #icon_big {
      position: absolute;
      left: 108px;
      top: 108px;
      width: 96px;
      height: 96px;
      overflow: hidden;
      div {
        transform-origin: 0 0;
        transform: scale(2);
      }
    }
  }

  #test {
    color: black;
    position: absolute;
    top: 10px;
    left: 10px;
  }

  .secondary {
    margin: 12px;
    height: 30%;
  }

  #title_a,
  #title_b {
    font-size: 36px;
    max-width: 9em;
    font-family: "MaisonNeueExtended", "Arial Black", sans-serif;
    font-weight: 700;
    margin: 1em 0;
  }

  @media (max-width: 414px), (max-height: 720px) {
    .primary {
      transform: scale(0.875);
    }
    #title,
    #title_a,
    #title_b {
      font-size: 32px;
    }
    #sports {
      font-size: 14px;
    }
  }

  @media (max-width: 375px), (max-height: 667px) {
    .primary {
      transform: scale(0.667);
    }
    #title,
    #title_a,
    #title_b {
      font-size: 28px;
    }
    #sports {
      font-size: 12px;
    }
  }

  @media (max-width: 320px), (max-height: 568px) {
    .primary {
      transform: scale(0.5);
    }
    #title,
    #title_a,
    #title_b {
      font-size: 24px;
    }
    #sports {
      font-size: 11px;
    }
  }

  @media (min-aspect-ratio: 7 / 8) {
    .container {
      -ms-flex-direction: row;
      flex-direction: row;
    }
    .reverse {
      -ms-flex-direction: row-reverse;
      flex-direction: row-reverse;
    }
    .secondary {
      height: auto;
      width: 30%;
    }
  }

  .sprite-svg {
    background: url("/images/strava/sprite-total-time.svg") no-repeat;
    &.arw-left {
      background-position: 94.91525423728814% 0;
      width: 17px;
      height: 25px;
    }
    &.arw-right {
      background-position: 94.91525423728814% 5.4945054945054945%;
      width: 17px;
      height: 25px;
    }
    &.sports_bike_light_large {
      background-position: 0 0;
      width: 48px;
      height: 48px;
    }
    &.sports_bike_light_medium {
      background-position: 73.6842105263158% 53.57142857142857%;
      width: 33px;
      height: 32px;
    }
    &.sports_bike_light_small {
      background-position: 20.734341252699785% 87.71929824561404%;
      width: 26px;
      height: 24px;
    }
    &.sports_bike_light_xsmall {
      background-position: 94.91525423728814% 10.775862068965518%;
      width: 17px;
      height: 16px;
    }
    &.sports_bike_normal_large {
      background-position: 10.884353741496598% 0;
      width: 48px;
      height: 48px;
    }
    &.sports_bike_normal_medium {
      background-position: 73.6842105263158% 60.714285714285715%;
      width: 33px;
      height: 32px;
    }
    &.sports_bike_normal_small {
      background-position: 26.34989200863931% 87.71929824561404%;
      width: 26px;
      height: 24px;
    }
    &.sports_bike_normal_xsmall {
      background-position: 94.91525423728814% 14.224137931034482%;
      width: 17px;
      height: 16px;
    }
    &.sports_e_bike_light_large {
      background-position: 0 11.11111111111111%;
      width: 48px;
      height: 48px;
    }
    &.sports_e_bike_light_medium {
      background-position: 73.52297592997812% 67.85714285714286%;
      width: 32px;
      height: 32px;
    }
    &.sports_e_bike_light_small {
      background-position: 42.58064516129032% 87.71929824561404%;
      width: 24px;
      height: 24px;
    }
    &.sports_e_bike_light_xsmall {
      background-position: 94.71458773784356% 24.56896551724138%;
      width: 16px;
      height: 16px;
    }
    &.sports_e_bike_normal_large {
      background-position: 10.884353741496598% 11.11111111111111%;
      width: 48px;
      height: 48px;
    }
    &.sports_e_bike_normal_medium {
      background-position: 0 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_e_bike_normal_small {
      background-position: 47.74193548387097% 87.71929824561404%;
      width: 24px;
      height: 24px;
    }
    &.sports_e_bike_normal_xsmall {
      background-position: 94.71458773784356% 28.017241379310345%;
      width: 16px;
      height: 16px;
    }
    &.sports_handcycle_light_large {
      background-position: 21.768707482993197% 0;
      width: 48px;
      height: 48px;
    }
    &.sports_handcycle_light_medium {
      background-position: 7.00218818380744% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_handcycle_light_small {
      background-position: 52.903225806451616% 87.71929824561404%;
      width: 24px;
      height: 24px;
    }
    &.sports_handcycle_light_xsmall {
      background-position: 94.71458773784356% 31.46551724137931%;
      width: 16px;
      height: 16px;
    }
    &.sports_handcycle_normal_large {
      background-position: 21.768707482993197% 11.11111111111111%;
      width: 48px;
      height: 48px;
    }
    &.sports_handcycle_normal_medium {
      background-position: 14.00437636761488% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_handcycle_normal_small {
      background-position: 58.064516129032256% 87.71929824561404%;
      width: 24px;
      height: 24px;
    }
    &.sports_handcycle_normal_xsmall {
      background-position: 94.71458773784356% 34.91379310344828%;
      width: 16px;
      height: 16px;
    }
    &.sports_hike_light_large {
      background-position: 0 22.22222222222222%;
      width: 48px;
      height: 48px;
    }
    &.sports_hike_light_medium {
      background-position: 21.00656455142232% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_hike_light_small {
      background-position: 63.225806451612904% 87.71929824561404%;
      width: 24px;
      height: 24px;
    }
    &.sports_hike_light_xsmall {
      background-position: 94.71458773784356% 38.36206896551724%;
      width: 16px;
      height: 16px;
    }
    &.sports_hike_normal_large {
      background-position: 10.884353741496598% 22.22222222222222%;
      width: 48px;
      height: 48px;
    }
    &.sports_hike_normal_medium {
      background-position: 28.00875273522976% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_hike_normal_small {
      background-position: 68.38709677419355% 87.71929824561404%;
      width: 24px;
      height: 24px;
    }
    &.sports_hike_normal_xsmall {
      background-position: 94.71458773784356% 41.810344827586206%;
      width: 16px;
      height: 16px;
    }
    &.sports_ice_skate_light_large {
      background-position: 21.768707482993197% 22.22222222222222%;
      width: 48px;
      height: 48px;
    }
    &.sports_ice_skate_light_medium {
      background-position: 35.010940919037196% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_ice_skate_light_small {
      background-position: 73.54838709677419% 87.71929824561404%;
      width: 24px;
      height: 24px;
    }
    &.sports_ice_skate_light_xsmall {
      background-position: 94.71458773784356% 45.258620689655174%;
      width: 16px;
      height: 16px;
    }
    &.sports_ice_skate_normal_large {
      background-position: 32.6530612244898% 0;
      width: 48px;
      height: 48px;
    }
    &.sports_ice_skate_normal_medium {
      background-position: 42.01312910284464% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_ice_skate_normal_small {
      background-position: 78.70967741935483% 87.71929824561404%;
      width: 24px;
      height: 24px;
    }
    &.sports_ice_skate_normal_xsmall {
      background-position: 94.71458773784356% 48.706896551724135%;
      width: 16px;
      height: 16px;
    }
    &.sports_inline_skate_light_large {
      background-position: 32.6530612244898% 11.11111111111111%;
      width: 48px;
      height: 48px;
    }
    &.sports_inline_skate_light_medium {
      background-position: 49.01531728665208% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_inline_skate_light_small {
      background-position: 83.87096774193549% 87.71929824561404%;
      width: 24px;
      height: 24px;
    }
    &.sports_inline_skate_light_xsmall {
      background-position: 94.71458773784356% 52.1551724137931%;
      width: 16px;
      height: 16px;
    }
    &.sports_inline_skate_normal_large {
      background-position: 32.6530612244898% 22.22222222222222%;
      width: 48px;
      height: 48px;
    }
    &.sports_inline_skate_normal_medium {
      background-position: 56.01750547045952% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_inline_skate_normal_small {
      background-position: 89.03225806451613% 87.71929824561404%;
      width: 24px;
      height: 24px;
    }
    &.sports_inline_skate_normal_xsmall {
      background-position: 94.71458773784356% 55.60344827586207%;
      width: 16px;
      height: 16px;
    }
    &.sports_kayaking_light_large {
      background-position: 0 33.333333333333336%;
      width: 48px;
      height: 48px;
    }
    &.sports_kayaking_light_medium {
      background-position: 63.01969365426696% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_kayaking_light_small {
      background-position: 0 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_kayaking_light_xsmall {
      background-position: 94.71458773784356% 59.05172413793103%;
      width: 16px;
      height: 16px;
    }
    &.sports_kayaking_normal_large {
      background-position: 10.884353741496598% 33.333333333333336%;
      width: 48px;
      height: 48px;
    }
    &.sports_kayaking_normal_medium {
      background-position: 70.02188183807439% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_kayaking_normal_small {
      background-position: 5.161290322580645% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_kayaking_normal_xsmall {
      background-position: 94.71458773784356% 62.5%;
      width: 16px;
      height: 16px;
    }
    &.sports_kitesurf_light_large {
      background-position: 21.768707482993197% 33.333333333333336%;
      width: 48px;
      height: 48px;
    }
    &.sports_kitesurf_light_medium {
      background-position: 77.02407002188184% 75%;
      width: 32px;
      height: 32px;
    }
    &.sports_kitesurf_light_small {
      background-position: 10.32258064516129% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_kitesurf_light_xsmall {
      background-position: 94.71458773784356% 65.94827586206897%;
      width: 16px;
      height: 16px;
    }
    &.sports_kitesurf_normal_large {
      background-position: 32.6530612244898% 33.333333333333336%;
      width: 48px;
      height: 48px;
    }
    &.sports_kitesurf_normal_medium {
      background-position: 84.02625820568927% 0;
      width: 32px;
      height: 32px;
    }
    &.sports_kitesurf_normal_small {
      background-position: 15.483870967741936% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_kitesurf_normal_xsmall {
      background-position: 94.71458773784356% 69.39655172413794%;
      width: 16px;
      height: 16px;
    }
    &.sports_multi_light_large {
      background-position: 43.53741496598639% 0;
      width: 48px;
      height: 48px;
    }
    &.sports_multi_light_medium {
      background-position: 84.02625820568927% 7.142857142857143%;
      width: 32px;
      height: 32px;
    }
    &.sports_multi_light_small {
      background-position: 20.64516129032258% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_multi_light_xsmall {
      background-position: 94.71458773784356% 72.84482758620689%;
      width: 16px;
      height: 16px;
    }
    &.sports_multi_normal_large {
      background-position: 43.53741496598639% 11.11111111111111%;
      width: 48px;
      height: 48px;
    }
    &.sports_multi_normal_medium {
      background-position: 84.02625820568927% 14.285714285714286%;
      width: 32px;
      height: 32px;
    }
    &.sports_multi_normal_small {
      background-position: 25.806451612903224% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_multi_normal_xsmall copy {
      background-position: 94.71458773784356% 76.29310344827586%;
      width: 16px;
      height: 16px;
    }
    &.sports_other_light_large {
      background-position: 43.53741496598639% 22.22222222222222%;
      width: 48px;
      height: 48px;
    }
    &.sports_other_light_medium {
      background-position: 84.02625820568927% 21.428571428571427%;
      width: 32px;
      height: 32px;
    }
    &.sports_other_light_small {
      background-position: 30.967741935483872% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_other_light_xsmall {
      background-position: 94.71458773784356% 79.74137931034483%;
      width: 16px;
      height: 16px;
    }
    &.sports_other_normal_large {
      background-position: 43.53741496598639% 33.333333333333336%;
      width: 48px;
      height: 48px;
    }
    &.sports_other_normal_medium {
      background-position: 84.02625820568927% 28.571428571428573%;
      width: 32px;
      height: 32px;
    }
    &.sports_other_normal_small {
      background-position: 36.12903225806452% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_other_normal_xsmall {
      background-position: 94.71458773784356% 83.1896551724138%;
      width: 16px;
      height: 16px;
    }
    &.sports_rock_climbing_light_large {
      background-position: 0 44.44444444444444%;
      width: 48px;
      height: 48px;
    }
    &.sports_rock_climbing_light_medium {
      background-position: 84.02625820568927% 35.714285714285715%;
      width: 32px;
      height: 32px;
    }
    &.sports_rock_climbing_light_small {
      background-position: 41.29032258064516% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_rock_climbing_light_xsmall {
      background-position: 94.71458773784356% 86.63793103448276%;
      width: 16px;
      height: 16px;
    }
    &.sports_rock_climbing_normal_large {
      background-position: 10.884353741496598% 44.44444444444444%;
      width: 48px;
      height: 48px;
    }
    &.sports_rock_climbing_normal_medium {
      background-position: 84.02625820568927% 42.857142857142854%;
      width: 32px;
      height: 32px;
    }
    &.sports_rock_climbing_normal_small {
      background-position: 46.45161290322581% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_rock_climbing_normal_xsmall {
      background-position: 87.9492600422833% 82.75862068965517%;
      width: 16px;
      height: 16px;
    }
    &.sports_rowing_light_large {
      background-position: 21.768707482993197% 44.44444444444444%;
      width: 48px;
      height: 48px;
    }
    &.sports_rowing_light_medium {
      background-position: 84.02625820568927% 50%;
      width: 32px;
      height: 32px;
    }
    &.sports_rowing_light_small {
      background-position: 51.61290322580645% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_rowing_light_xsmall {
      background-position: 91.33192389006342% 82.75862068965517%;
      width: 16px;
      height: 16px;
    }
    &.sports_rowing_normal_large {
      background-position: 32.6530612244898% 44.44444444444444%;
      width: 48px;
      height: 48px;
    }
    &.sports_rowing_normal_medium {
      background-position: 84.02625820568927% 57.142857142857146%;
      width: 32px;
      height: 32px;
    }
    &.sports_rowing_normal_small {
      background-position: 56.774193548387096% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_rowing_normal_xsmall {
      background-position: 81.18393234672304% 75.86206896551724%;
      width: 16px;
      height: 16px;
    }
    &.sports_run_light_large {
      background-position: 43.53741496598639% 44.44444444444444%;
      width: 48px;
      height: 48px;
    }
    &.sports_run_light_medium {
      background-position: 84.02625820568927% 64.28571428571429%;
      width: 32px;
      height: 32px;
    }
    &.sports_run_light_small {
      background-position: 61.935483870967744% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_run_light_xsmall {
      background-position: 94.91525423728814% 17.67241379310345%;
      width: 17px;
      height: 16px;
    }
    &.sports_run_normal_large {
      background-position: 54.42176870748299% 0;
      width: 48px;
      height: 48px;
    }
    &.sports_run_normal_medium {
      background-position: 84.02625820568927% 71.42857142857143%;
      width: 32px;
      height: 32px;
    }
    &.sports_run_normal_small {
      background-position: 67.09677419354838% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_run_normal_xsmall {
      background-position: 94.91525423728814% 21.120689655172413%;
      width: 17px;
      height: 16px;
    }
    &.sports_ski_light_large {
      background-position: 54.42176870748299% 11.11111111111111%;
      width: 48px;
      height: 48px;
    }
    &.sports_ski_light_medium {
      background-position: 0 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_ski_light_small {
      background-position: 72.25806451612904% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_ski_light_xsmall {
      background-position: 84.56659619450318% 75.86206896551724%;
      width: 16px;
      height: 16px;
    }
    &.sports_ski_normal_large {
      background-position: 54.42176870748299% 22.22222222222222%;
      width: 48px;
      height: 48px;
    }
    &.sports_ski_normal_medium {
      background-position: 7.00218818380744% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_ski_normal_small {
      background-position: 77.41935483870968% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_ski_normal_xsmall {
      background-position: 77.80126849894292% 65.51724137931035%;
      width: 16px;
      height: 16px;
    }
    &.sports_snow_light_large {
      background-position: 54.42176870748299% 33.333333333333336%;
      width: 48px;
      height: 48px;
    }
    &.sports_snow_light_medium {
      background-position: 14.00437636761488% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_snow_light_small {
      background-position: 82.58064516129032% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_snow_light_xsmall {
      background-position: 77.80126849894292% 68.96551724137932%;
      width: 16px;
      height: 16px;
    }
    &.sports_snow_normal_large {
      background-position: 54.42176870748299% 44.44444444444444%;
      width: 48px;
      height: 48px;
    }
    &.sports_snow_normal_medium {
      background-position: 21.00656455142232% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_snow_normal_small {
      background-position: 87.74193548387096% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_snow_normal_xsmall {
      background-position: 10.14799154334038% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_snowboard_light_large {
      background-position: 0 55.55555555555556%;
      width: 48px;
      height: 48px;
    }
    &.sports_snowboard_light_medium {
      background-position: 28.00875273522976% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_snowboard_light_small {
      background-position: 92.90322580645162% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_snowboard_light_xsmall {
      background-position: 13.530655391120508% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_snowboard_normal_large {
      background-position: 10.884353741496598% 55.55555555555556%;
      width: 48px;
      height: 48px;
    }
    &.sports_snowboard_normal_medium {
      background-position: 35.010940919037196% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_snowboard_normal_small {
      background-position: 100% 0;
      width: 24px;
      height: 24px;
    }
    &.sports_snowboard_normal_xsmall {
      background-position: 16.913319238900634% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_snowshoe_light_large {
      background-position: 21.768707482993197% 55.55555555555556%;
      width: 48px;
      height: 48px;
    }
    &.sports_snowshoe_light_medium {
      background-position: 42.01312910284464% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_snowshoe_light_small {
      background-position: 100% 5.2631578947368425%;
      width: 24px;
      height: 24px;
    }
    &.sports_snowshoe_light_xsmall {
      background-position: 20.29598308668076% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_snowshoe_normal_large {
      background-position: 32.6530612244898% 55.55555555555556%;
      width: 48px;
      height: 48px;
    }
    &.sports_snowshoe_normal_medium {
      background-position: 49.01531728665208% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_snowshoe_normal_small {
      background-position: 100% 10.526315789473685%;
      width: 24px;
      height: 24px;
    }
    &.sports_snowshoe_normal_xsmall {
      background-position: 23.67864693446089% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_stand_up_paddling_light_large {
      background-position: 43.53741496598639% 55.55555555555556%;
      width: 48px;
      height: 48px;
    }
    &.sports_stand_up_paddling_light_medium {
      background-position: 56.01750547045952% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_stand_up_paddling_light_small {
      background-position: 100% 15.789473684210526%;
      width: 24px;
      height: 24px;
    }
    &.sports_stand_up_paddling_light_xsmall {
      background-position: 27.061310782241016% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_stand_up_paddling_normal_large {
      background-position: 54.42176870748299% 55.55555555555556%;
      width: 48px;
      height: 48px;
    }
    &.sports_stand_up_paddling_normal_medium {
      background-position: 63.01969365426696% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_stand_up_paddling_normal_small {
      background-position: 100% 21.05263157894737%;
      width: 24px;
      height: 24px;
    }
    &.sports_stand_up_paddling_normal_xsmall {
      background-position: 30.443974630021142% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_surfing_light_large {
      background-position: 65.3061224489796% 0;
      width: 48px;
      height: 48px;
    }
    &.sports_surfing_light_medium {
      background-position: 70.02188183807439% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_surfing_light_small {
      background-position: 100% 26.31578947368421%;
      width: 24px;
      height: 24px;
    }
    &.sports_surfing_light_xsmall {
      background-position: 33.82663847780127% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_surfing_normal_large {
      background-position: 65.3061224489796% 11.11111111111111%;
      width: 48px;
      height: 48px;
    }
    &.sports_surfing_normal_medium {
      background-position: 77.02407002188184% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_surfing_normal_small {
      background-position: 100% 31.57894736842105%;
      width: 24px;
      height: 24px;
    }
    &.sports_surfing_normal_xsmall {
      background-position: 37.2093023255814% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_triathlon_light_large {
      background-position: 65.3061224489796% 22.22222222222222%;
      width: 48px;
      height: 48px;
    }
    &.sports_triathlon_light_medium {
      background-position: 84.02625820568927% 82.14285714285714%;
      width: 32px;
      height: 32px;
    }
    &.sports_triathlon_light_small {
      background-position: 100% 36.8421052631579%;
      width: 24px;
      height: 24px;
    }
    &.sports_triathlon_light_xsmall {
      background-position: 40.59196617336152% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_triathlon_normal_large {
      background-position: 65.3061224489796% 33.333333333333336%;
      width: 48px;
      height: 48px;
    }
    &.sports_triathlon_normal_medium {
      background-position: 91.02844638949672% 0;
      width: 32px;
      height: 32px;
    }
    &.sports_triathlon_normal_small {
      background-position: 100% 42.10526315789474%;
      width: 24px;
      height: 24px;
    }
    &.sports_triathlon_normal_xsmall {
      background-position: 43.97463002114165% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_velomobile_light_large {
      background-position: 65.3061224489796% 44.44444444444444%;
      width: 48px;
      height: 48px;
    }
    &.sports_velomobile_light_medium {
      background-position: 91.02844638949672% 7.142857142857143%;
      width: 32px;
      height: 32px;
    }
    &.sports_velomobile_light_small {
      background-position: 100% 47.36842105263158%;
      width: 24px;
      height: 24px;
    }
    &.sports_velomobile_light_xsmall {
      background-position: 47.35729386892178% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_velomobile_normal_large {
      background-position: 65.3061224489796% 55.55555555555556%;
      width: 48px;
      height: 48px;
    }
    &.sports_velomobile_normal_medium {
      background-position: 91.02844638949672% 14.285714285714286%;
      width: 32px;
      height: 32px;
    }
    &.sports_velomobile_normal_small {
      background-position: 100% 52.63157894736842%;
      width: 24px;
      height: 24px;
    }
    &.sports_velomobile_normal_xsmall {
      background-position: 50.7399577167019% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_walk_light_large {
      background-position: 0 66.66666666666667%;
      width: 48px;
      height: 48px;
    }
    &.sports_walk_light_medium {
      background-position: 91.02844638949672% 21.428571428571427%;
      width: 32px;
      height: 32px;
    }
    &.sports_walk_light_small {
      background-position: 31.896551724137932% 87.71929824561404%;
      width: 25px;
      height: 24px;
    }
    &.sports_walk_light_xsmall {
      background-position: 54.12262156448203% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_walk_normal_large {
      background-position: 10.884353741496598% 66.66666666666667%;
      width: 48px;
      height: 48px;
    }
    &.sports_walk_normal_medium {
      background-position: 91.02844638949672% 28.571428571428573%;
      width: 32px;
      height: 32px;
    }
    &.sports_walk_normal_small {
      background-position: 37.28448275862069% 87.71929824561404%;
      width: 25px;
      height: 24px;
    }
    &.sports_walk_normal_xsmall {
      background-position: 57.505285412262154% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_water_light_large {
      background-position: 21.768707482993197% 66.66666666666667%;
      width: 48px;
      height: 48px;
    }
    &.sports_water_light_medium {
      background-position: 91.02844638949672% 35.714285714285715%;
      width: 32px;
      height: 32px;
    }
    &.sports_water_light_small {
      background-position: 100% 57.89473684210526%;
      width: 24px;
      height: 24px;
    }
    &.sports_water_light_xsmall {
      background-position: 60.887949260042284% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_water_normal_large {
      background-position: 32.6530612244898% 66.66666666666667%;
      width: 48px;
      height: 48px;
    }
    &.sports_water_normal_medium {
      background-position: 91.02844638949672% 42.857142857142854%;
      width: 32px;
      height: 32px;
    }
    &.sports_water_normal_small {
      background-position: 100% 63.1578947368421%;
      width: 24px;
      height: 24px;
    }
    &.sports_water_normal_xsmall {
      background-position: 64.27061310782241% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_weight_training_light_large {
      background-position: 43.53741496598639% 66.66666666666667%;
      width: 48px;
      height: 48px;
    }
    &.sports_weight_training_light_medium {
      background-position: 91.02844638949672% 50%;
      width: 32px;
      height: 32px;
    }
    &.sports_weight_training_light_small {
      background-position: 100% 68.42105263157895%;
      width: 24px;
      height: 24px;
    }
    &.sports_weight_training_light_xsmall {
      background-position: 67.65327695560254% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_weight_training_normal_large {
      background-position: 54.42176870748299% 66.66666666666667%;
      width: 48px;
      height: 48px;
    }
    &.sports_weight_training_normal_medium {
      background-position: 91.02844638949672% 57.142857142857146%;
      width: 32px;
      height: 32px;
    }
    &.sports_weight_training_normal_small {
      background-position: 100% 73.6842105263158%;
      width: 24px;
      height: 24px;
    }
    &.sports_weight_training_normal_xsmall {
      background-position: 71.03594080338266% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_wheelchair_light_large {
      background-position: 65.3061224489796% 66.66666666666667%;
      width: 48px;
      height: 48px;
    }
    &.sports_wheelchair_light_medium {
      background-position: 91.02844638949672% 64.28571428571429%;
      width: 32px;
      height: 32px;
    }
    &.sports_wheelchair_light_small {
      background-position: 100% 78.94736842105263%;
      width: 24px;
      height: 24px;
    }
    &.sports_wheelchair_light_xsmall {
      background-position: 74.4186046511628% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_wheelchair_normal_large {
      background-position: 76.19047619047619% 0;
      width: 48px;
      height: 48px;
    }
    &.sports_wheelchair_normal_medium {
      background-position: 91.02844638949672% 71.42857142857143%;
      width: 32px;
      height: 32px;
    }
    &.sports_wheelchair_normal_small {
      background-position: 100% 84.21052631578948%;
      width: 24px;
      height: 24px;
    }
    &.sports_wheelchair_normal_xsmall {
      background-position: 77.80126849894292% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_windsurf_light_large {
      background-position: 76.19047619047619% 11.11111111111111%;
      width: 48px;
      height: 48px;
    }
    &.sports_windsurf_light_medium {
      background-position: 91.02844638949672% 78.57142857142857%;
      width: 32px;
      height: 32px;
    }
    &.sports_windsurf_light_small {
      background-position: 100% 89.47368421052632%;
      width: 24px;
      height: 24px;
    }
    &.sports_windsurf_light_xsmall {
      background-position: 81.18393234672304% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_windsurf_normal_large {
      background-position: 76.19047619047619% 22.22222222222222%;
      width: 48px;
      height: 48px;
    }
    &.sports_windsurf_normal_medium {
      background-position: 0 89.28571428571429%;
      width: 32px;
      height: 32px;
    }
    &.sports_windsurf_normal_small {
      background-position: 100% 94.73684210526316%;
      width: 24px;
      height: 24px;
    }
    &.sports_windsurf_normal_xsmall {
      background-position: 84.56659619450318% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_yoga_light_large {
      background-position: 76.19047619047619% 33.333333333333336%;
      width: 48px;
      height: 48px;
    }
    &.sports_yoga_light_medium {
      background-position: 7.00218818380744% 89.28571428571429%;
      width: 32px;
      height: 32px;
    }
    &.sports_yoga_light_small {
      background-position: 0 100%;
      width: 24px;
      height: 24px;
    }
    &.sports_yoga_light_xsmall {
      background-position: 87.9492600422833% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
    &.sports_yoga_normal_large {
      background-position: 76.19047619047619% 44.44444444444444%;
      width: 48px;
      height: 48px;
    }
    &.sports_yoga_normal_medium {
      background-position: 14.00437636761488% 89.28571428571429%;
      width: 32px;
      height: 32px;
    }
    &.sports_yoga_normal_small {
      background-position: 5.161290322580645% 100%;
      width: 24px;
      height: 24px;
    }
    &.sports_yoga_normal_xsmall {
      background-position: 91.33192389006342% 98.27586206896552%;
      width: 16px;
      height: 16px;
    }
  }
</style>
