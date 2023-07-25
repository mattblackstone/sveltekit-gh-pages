<script>
  /* global Back, Power2, Power3, Power4, TimelineMax, TweenMax */
  /* eslint-disable no-plusplus */
  import { base } from "$app/paths";
  import { onMount } from 'svelte';
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
  function insertCommas(input, n) {
    if (n === void 0) {
      n = 3;
    }

    // TODO: account for decimals
    var str =
      typeof input === "string" ? input : Math.round(input).toString();
    var commas = Math.ceil(str.length / n) - 1;
    var arr = [];
    var start = 0;
    var end = str.length % n || n;

    for (var i = 0; i <= commas; i += 1) {
      arr.push(str.substring(start, end));
      start = end;
      end += n;
    }

    return arr.join(",");
  }
  var chunk = function chunk(arr, chunkSize, cache) {
    if (chunkSize === void 0) {
      chunkSize = 1;
    }

    if (cache === void 0) {
      cache = [];
    }

    var tmp = [].concat(arr);
    if (chunkSize <= 0) return cache;

    while (tmp.length) {
      cache.push(tmp.splice(0, chunkSize));
    }

    return cache;
  };

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

  /* eslint-disable no-console */
  var Animation = {
    init: function init() {
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
      var athleteURL = "/data/strava/" + names[name] + ".json";
      var athleteReq = new XMLHttpRequest();
      var tweenProxy = {
        units: 0,
      };
      var animationA = new TimelineMax({
        paused: true,
      });
      var animationB = new TimelineMax({
        paused: true,
      });
      var lang = "en";
      var everest = 8848; // meters

      var copy = {
        elevationA: {
          en: {
            head: "Movin’ up in the world.",
            subhead: "That’s like climbing [X] Mt.Everests.",
          },
          es: "",
          de: "",
        },
        elevationB: {
          en: {
            head: "RIP your quads.",
            subhead: "[X] [units] during [title]",
          },
          es: "",
          de: "",
        },
      };
      var elevationDisplay = {
        units: 0,
      };
      var hilliestDay = 0;
      var visualStyle;
      var visualW;
      var visualH;
      var totalElevation = 0;
      var pointer;
      var yisData;

      function updateElevationText() {
        dom.elevation_text_a.innerHTML = insertCommas(tweenProxy.units);
        dom.elevation_text.innerHTML = insertCommas(elevationDisplay.units);
      }

      window.addEventListener("pointerupdate", function (e) {
        pointer = e.detail.pointer;
        TweenMax.set("#mask_b", {
          y: pointer.y,
        });
        TweenMax.set("#content_b", {
          y: -pointer.y,
        });

        if (pointer.type) {
          if (pointer.ratioY > 0.5) {
            animationA.seek(
              (animationA.totalDuration() * (pointer.ratioY - 0.5)) / 0.5
            );
            updateElevationText();
            animationB.seek(0);
          }

          if (pointer.ratioY === 0.5) {
            animationA.seek(0);
            updateElevationText();
            animationB.seek(0);
          }

          if (pointer.ratioY < 0.5) {
            animationB.seek(
              animationB.totalDuration() * (1 - pointer.ratioY * 2)
            );
            updateElevationText();
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
        var _yisData = yisData,
          athleteInfo = _yisData.athleteInfo,
          hilliestActivity = _yisData.hilliestActivity,
          totalElevationGainMeters = _yisData.totalElevationGainMeters;
        totalElevation = totalElevationGainMeters; // 2019 format

        hilliestDay = hilliestActivity.elevGainMeters; // 2019 format

        var unitPreference = athleteInfo.measurementPreference;
        var unitAbbrSm = unitPreference === "feet" ? " ft" : " m";
        var unitMultipleSm = unitPreference === "feet" ? 3.28084 : 1;
        var totalUnits = hilliestDay * unitMultipleSm;
        var totalElevationUnits = totalElevation * unitMultipleSm;
        dom.elevation_units_a.innerHTML = unitAbbrSm;
        dom.head_a.innerHTML = copy.elevationA[lang].head;
        dom.subhead_a.innerHTML = copy.elevationA[lang].subhead.replace(
          /\[x\]/i,
          (totalElevation / everest).toFixed(1)
        );
        dom.elevation_units.innerHTML = unitAbbrSm;
        dom.head.innerHTML = copy.elevationB[lang].head;
        dom.subhead.innerHTML = hilliestActivity.title; // eslint-disable-next-line prefer-destructuring

        dom.date.innerHTML = hilliestActivity.date.split(" ")[0];
        var paths = dom.mountain.getElementsByTagNameNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        var mtDur = 7;
        animationA.from(paths, mtDur, {
          scaleY: 0.75,
          transformOrigin: "0% 125%",
          ease: Power3.easeOut,
        });
        animationA.from(
          ".st0",
          mtDur / 2,
          {
            y: 140,
            ease: Back.easeOut,
          },
          mtDur / 2
        ); // flag

        animationA.from(
          ".st1",
          mtDur,
          {
            y: 74,
            ease: Power3.easeOut,
          },
          0
        );
        animationA.from(
          ".st2",
          mtDur,
          {
            y: 77,
            ease: Power3.easeOut,
          },
          0
        );
        animationA.from(
          ".st3",
          mtDur,
          {
            y: 30,
            ease: Power3.easeOut,
          },
          0
        );
        animationA.from(
          ".st4",
          mtDur,
          {
            y: 34,
            ease: Power3.easeOut,
          },
          0
        );
        animationA.from(
          paths[0],
          0.5,
          {
            scaleX: 0.1,
            ease: Power3.easeIn,
          },
          mtDur * 0.9
        );
        animationA.from(
          dom.elevation_text_a,
          0.1,
          {
            opacity: 0,
          },
          0
        );
        animationA.to(
          tweenProxy,
          mtDur,
          {
            units: totalElevationUnits,
            ease: Power3.easeInOut,
            onUpdate: updateElevationText,
          },
          0
        ); // onUpdate doesn't fire on seek

        animationA.from(dom.elevation_units_a, 0.1, {
          opacity: 0,
        });
        animationA.staggerFrom(
          [dom.head_a, dom.subhead_a],
          0.5,
          {
            y: 30,
            opacity: 0,
            ease: Power3.easeOut,
          },
          0.25
        );

        function getVisualSize() {
          visualStyle = window.getComputedStyle(dom.visual);
          visualW = parseInt(visualStyle.width, 10);
          visualH = parseInt(visualStyle.height, 10);
          dom.elevation_profile.setAttribute("width", visualW);
          dom.elevation_profile.setAttribute("height", visualH);
        }

        getVisualSize();
        dom.elevation_profile.setAttribute(
          "viewBox",
          "0 0 " + visualW + " " + visualH
        );
        dom.elevation_profile.setAttribute("preserveAspectRatio", "none"); // stretch

        window.addEventListener("resize", getVisualSize);
        var elevProfile = new DocumentFragment();
        var elevGainChart = hilliestActivity.elevGainChart;
        var columnEvery = 8;
        var chunkSize = Math.ceil(
          elevGainChart.length / (visualW / columnEvery)
        );
        var elevations = chunk(elevGainChart, chunkSize).map(function (x) {
          return Math.max.apply(Math, x);
        });
        var columnOffset = Math.round(
          (visualW - elevations.length * columnEvery) / 2 + columnEvery / 2
        );
        var elevMin = Math.min.apply(Math, elevations);
        var elevMax = Math.max.apply(Math, elevations);
        var elevRange = elevMax - elevMin;
        var lineH = visualH / 2;
        var lineDur = 1;
        var lineStagger = 0.1;
        var lineTweens = [];
        var lineMax = {
          x: 0,
          y: 0,
        };
        var lineEl;
        var lineX;
        var lineY;
        elevations.forEach(function (elev, i) {
          lineX = i * columnEvery + columnOffset;
          lineY = ((elev - elevMin) / elevRange) * (lineH - 1) + 2;
          lineEl = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          lineEl.setAttribute("class", "elev-line");
          lineEl.setAttribute("x1", lineX);
          lineEl.setAttribute("y1", 0);
          lineEl.setAttribute("x2", lineX);
          lineEl.setAttribute("y2", lineH);

          if (lineY > lineMax.y) {
            lineMax.x = lineX;
            lineMax.y = lineY;
          }

          elevProfile.appendChild(lineEl);
          lineTweens.push({
            elem: lineEl,
            dur: lineDur,
            vars1: {
              y: lineY * 0.1 - lineH,
            },
            vars2: {
              y: visualH - lineY,
              ease: Power2.easeInOut,
            },
            start: i * lineStagger,
          });
        });
        dom.elevation_profile.appendChild(elevProfile);
        var dot = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        var dotSize = 18;
        dot.setAttribute("cx", lineMax.x);
        dot.setAttribute("cy", lineMax.y - dotSize / 2);
        dot.setAttribute("r", dotSize / 3);
        dot.setAttribute("stroke-width", dotSize / 3);
        dot.setAttribute("class", "dot");
        dom.elevation_profile.appendChild(dot);
        lineTweens.forEach(function (tween) {
          var elem = tween.elem,
            dur = tween.dur,
            vars1 = tween.vars1,
            vars2 = tween.vars2,
            start = tween.start;
          animationB.fromTo(elem, dur, vars1, vars2, start);
        });
        var dur = elevations.length * lineStagger + lineDur;
        animationB.from(
          dom.elevation_text,
          dur / 2,
          {
            opacity: 0,
            ease: Power4.easeIn,
          },
          0
        );
        animationB.to(
          elevationDisplay,
          dur,
          {
            units: totalUnits,
            ease: Power3.easeInOut,
            onUpdate: updateElevationText,
          },
          0
        ); // onUpdate doesn't fire on seek

        animationB.from(dom.elevation_units, 0.1, {
          opacity: 0,
        });
        animationB.from(dot, 2, {
          y: lineH + dotSize,
          ease: Back.easeOut,
        });
        animationB.from(
          dom.head,
          0.5,
          {
            y: 30,
            opacity: 0,
            ease: Power3.easeOut,
          },
          dur - 2
        );
        animationB.staggerFrom(
          [dom.subhead, dom.date],
          0.5,
          {
            y: 30,
            opacity: 0,
            ease: Power3.easeOut,
          },
          0.5
        );
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
    TOTAL ELEVATION GAIN
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
    HILLIEST DAY
  </div>
  <div id="main_content" class="invisible">
    <div id="parallax">
      <div id="mask_a">
        <div id="content_a" class="container">
          <!-- <div class="top-half"> -->
          <div class="visual-a">
            <svg
              id="mountain"
              xmlns="http://www.w3.org/2000/svg"
              width="385"
              height="310"
              viewBox="0 0 385 310"
            >
              <style type="text/css">
                .st0 {
                  fill: #fc5200;
                }

                .st1 {
                  fill: #ffffff;
                }

                .st2 {
                  fill: #dfdfe8;
                }

                .st3 {
                  fill: #a4a4a4;
                }

                .st4 {
                  fill: #6d6d78;
                }
              </style>
              <path class="st0" d="M189.6,33.2l-12.5,7.2V26L189.6,33.2z" />
              <path
                class="st1"
                d="M106,137.4v25.1l25.9,30.5l37.1-3l37,14.5l37.8-20.3L177.1,40.4L157,52.2l-20.1,52.1L106,137.4z"
              />
              <path
                class="st2"
                d="M106,137.4v25.1l25.9,30.5l10.2-55.7l14.9-85l-20.2,52.1L106,137.4z"
              />
              <path
                class="st3"
                d="M53,245L0,310h385L244,184.2l-54.2-46.9L157,176.5l-14.8-39.1L106,162.5l-37.1,26.9L53,245z"
              />
              <path
                class="st4"
                d="M53,245l-13.1,51.5l74.2-51.5l22.6-30.7l5.4-77L106,162.5l-37.1,26.9L53,245z"
              />
              <path
                class="st4"
                d="M53,244.9L0,310h187.4l-73.3-65.1l-35.3-32.8L53,244.9z"
              />
            </svg>
          </div>
          <!-- </div> -->
          <div class="bottom-half">
            <h1 id="number_a">
              <span id="elevation_text_a" /><span id="elevation_units_a" />
            </h1>
            <h2 id="head_a"> </h2>
            <h4 id="subhead_a"> </h4>
          </div>
        </div>
      </div>
      <div id="mask_b">
        <div id="content_b" class="container">
          <div class="text-over top-half">
            <h1 id="number">
              <span id="elevation_text" /><span id="elevation_units" />
            </h1>
            <h2 id="head"> </h2>
            <h4 id="subhead"> </h4>
            <h5 id="date"> </h5>
          </div>
          <div id="visual" class="bottom-half">
            <svg id="elevation_profile" xmlns="http://www.w3.org/2000/svg" />
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
  href="{base}/strava/total-time"
    onclick="location.href=this.href+window.location.hash;return false;"
  >
    <div class="btn-prev">
      <div class="sprite-svg arw-left" />
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

  a img,
  :link img,
  :visited img {
    border: 0;
  }

  *,
  *:before,
  *:after {
    box-sizing: border-box;
  }

  .alpha-0 {
    opacity: 0;
  }

  .invisible {
    visibility: hidden;
  }

  .none {
    display: none !important;
  }

  .offstage {
    position: absolute;
    left: -4000px;
    top: -4000px;
  }

  .transform-reset {
    transform: none !important;
  }

  .anti-alias,
  .white-text-alias-mac {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .gpu {
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    transform: translateZ(0);
  }

  @supports (-moz-appearance: meterbar) {
    .gpu {
      transform: translateZ(0) rotate(0.02deg);
    }
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

  html,
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
  }

  .cell {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .primary {
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
    display: flex;
    align-items: center;
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

  .container {
    justify-content: center;
  }

  .top-half {
    transform-origin: bottom;
  }

  .bottom-half {
    transform-origin: top;
    max-width: 540px;
  }

  #number,
  #number_a {
    white-space: nowrap;
  }

  #elevation_text_a {
    font-family: "MaisonNeueExtended", "Arial Black", sans-serif;
    font-weight: 800;
    color: #fc5200;
  }

  #elevation_units_a {
    font-weight: 600;
  }

  #elevation_text {
    font-family: "MaisonNeueExtended", "Arial Black", sans-serif;
    font-weight: 800;
  }

  #elevation_units {
    font-weight: 600;
    color: #dfdfe8;
  }

  #head {
    color: #dfdfe8;
  }

  #subhead {
    font-family: "MaisonNeueExtended", "Arial Black", sans-serif;
    font-weight: 800;
    text-align: center;
  }

  #date {
    font-family: "MaisonNeueExtended", "Arial Black", sans-serif;
    color: #a4a4a4;
    text-align: center;
  }

  .text-over {
    width: 100%;
    max-width: 540px;
  }

  #visual {
    overflow: hidden;
    width: 100%;
    height: 50%;
    max-width: 540px;
  }
  #visual svg .elev-line {
    stroke: #fc5200;
    stroke-linecap: butt;
    stroke-width: 2px;
    transform-origin: top;
  }
  #visual svg .dot {
    fill: #fc5200;
    stroke: black;
  }

  @media (min-aspect-ratio: 7 / 8) {
    .container {
      -ms-flex-direction: row;
      flex-direction: row;
    }
  }

  #test {
    color: black;
    position: absolute;
    top: 10px;
    left: 10px;
  }

  .visual {
    transform: scale(1.5);
  }

  .visual-a,
  .visual-a svg {
    width: 385px;
    height: 310px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0.2em 5vw;
    text-align: center;
    line-height: 1.125;
  }

  h1 {
    font-size: 100px;
    font-family: "MaisonNeueExtended", "Arial Black", sans-serif;
    font-weight: 800;
  }

  h2 {
    font-size: 48px;
    font-family: "MaisonNeueExtended", "Arial Black", sans-serif;
    font-weight: 600;
  }

  h3 {
    font-size: 36px;
    font-family: "MaisonNeueExtended", "Arial Black", sans-serif;
    font-weight: 600;
  }

  h4 {
    font-size: 24px;
    font-family: "MaisonNeue", "Segoe UI", "Helvetica Neue", -apple-system,
      system-ui, BlinkMacSystemFont, Roboto, Arial, sans-serif;
    font-weight: 600;
  }

  h5 {
    font-size: 18px;
    font-family: "MaisonNeue", "Segoe UI", "Helvetica Neue", -apple-system,
      system-ui, BlinkMacSystemFont, Roboto, Arial, sans-serif;
    font-weight: 600;
  }

  h6 {
    font-size: 16px;
    font-family: "MaisonNeue", "Segoe UI", "Helvetica Neue", -apple-system,
      system-ui, BlinkMacSystemFont, Roboto, Arial, sans-serif;
    font-weight: 400;
  }

  @media (max-width: 414px), (max-height: 720px) {
    .visual {
      transform: scale(1);
    }
    .visual-a,
    .visual-a svg {
      width: 336.875px;
      height: 271.25px;
    }
    h1 {
      font-size: 64px;
    }
  }

  @media (max-width: 375px), (max-height: 667px) {
    .visual {
      transform: scale(0.875);
    }
    .visual-a,
    .visual-a svg {
      width: 288.75px;
      height: 232.5px;
    }
    h1 {
      font-size: 56px;
    }
    h2 {
      font-size: 42px;
    }
    h3 {
      font-size: 32px;
    }
    h4 {
      font-size: 21px;
    }
    h5 {
      font-size: 17px;
    }
    h6 {
      font-size: 15px;
    }
  }

  @media (max-width: 320px), (max-height: 568px) {
    .visual {
      transform: scale(0.667);
    }
    .visual-a,
    .visual-a svg {
      width: 256.795px;
      height: 206.77px;
    }
    h1 {
      font-size: 48px;
    }
    h2 {
      font-size: 36px;
    }
    h3 {
      font-size: 24px;
    }
    h4 {
      font-size: 18px;
    }
    h5 {
      font-size: 16px;
    }
    h6 {
      font-size: 14px;
    }
  }

  .sprite-svg {
    background: url("/images/strava/sprite-elevation.svg") no-repeat;
  }
  .sprite-svg.arw-left {
    background-position: 0 0;
    width: 17px;
    height: 25px;
  }
  .sprite-svg.arw-right {
    background-position: 100% 0;
    width: 17px;
    height: 25px;
  }
</style>
