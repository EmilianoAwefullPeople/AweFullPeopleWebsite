(function () {
  // ── Waitlist modal ──
  var backdrop = document.getElementById("jo-modal-backdrop");
  var modalClose = document.getElementById("jo-modal-close");
  var openTriggers = document.querySelectorAll("[data-open-waitlist]");
  var lastFocused = null;

  function openModal(e) {
    if (e) e.preventDefault();
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        backdrop.classList.add("is-open");
      });
    });
    var emailField = document.getElementById("jo-email");
    if (emailField) emailField.focus();
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    backdrop.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  openTriggers.forEach(function (el) {
    el.addEventListener("click", openModal);
  });

  if (modalClose) modalClose.addEventListener("click", closeModal);

  if (backdrop) {
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) closeModal();
    });

    backdrop.addEventListener("transitionend", function (e) {
      if (e.target === backdrop && e.propertyName === "opacity" && !backdrop.classList.contains("is-open")) {
        backdrop.hidden = true;
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && backdrop && !backdrop.hidden) {
      closeModal();
    }
  });

  // ── Waitlist form ──
  var form = document.getElementById("jo-waitlist-form");
  var status = document.getElementById("jo-form-status");

  if (form && status) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nameField = document.getElementById("jo-name");
      var emailField = document.getElementById("jo-email");
      var phoneField = document.getElementById("jo-phone");
      var instagramField = document.getElementById("jo-instagram");

      var name = nameField.value.trim();
      var email = emailField.value.trim();
      var phone = phoneField.value.trim();
      var instagram = instagramField.value.trim();
      var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name) {
        status.className = "jo-form-status err";
        status.textContent = "Please enter your name.";
        nameField.focus();
        return;
      }

      if (!emailValid) {
        status.className = "jo-form-status err";
        status.textContent = "Please enter a valid email address.";
        emailField.focus();
        return;
      }

      if (!window.JO_SUPABASE_URL || !window.JO_SUPABASE_ANON_KEY) {
        status.className = "jo-form-status err";
        status.textContent = "Signups aren't connected yet. Please try again soon.";
        console.error("Journey Onward: Supabase URL/anon key not configured. Set them in config.js.");
        return;
      }

      var submitBtn = form.querySelector(".jo-btn-wrap");
      var submitLabel = submitBtn.querySelector(".jo-btn");
      var originalLabel = submitLabel.textContent;

      submitBtn.disabled = true;
      submitLabel.textContent = "Joining…";
      status.className = "jo-form-status";
      status.textContent = "";

      fetch(window.JO_SUPABASE_URL + "/rest/v1/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: window.JO_SUPABASE_ANON_KEY,
          Authorization: "Bearer " + window.JO_SUPABASE_ANON_KEY,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone || null,
          instagram: instagram || null,
        }),
      })
        .then(function (res) {
          if (res.ok) {
            status.className = "jo-form-status ok";
            status.textContent = "You're on the list. See you soon!";
            form.reset();
            return;
          }
          return res.json().catch(function () {
            return null;
          }).then(function (data) {
            if (res.status === 409 || (data && data.code === "23505")) {
              status.className = "jo-form-status err";
              status.textContent = "This email is already on the waitlist.";
            } else {
              status.className = "jo-form-status err";
              status.textContent = "Something went wrong. Please try again.";
              console.error("Journey Onward waitlist signup error:", data);
            }
          });
        })
        .catch(function (err) {
          status.className = "jo-form-status err";
          status.textContent = "Something went wrong. Please try again.";
          console.error("Journey Onward waitlist signup error:", err);
        })
        .then(function () {
          submitBtn.disabled = false;
          submitLabel.textContent = originalLabel;
        });
    });
  }

  // ── Carousel ──
  var track = document.getElementById("jo-carousel-track");
  var dots = document.querySelectorAll("#jo-dots .jo-dot");

  if (track && dots.length) {
    var slides = track.querySelectorAll(".jo-slide");
    var activeIndex = 0;
    var autoplayTimer = null;
    var resumeTimer = null;
    var autoplayMs = 4500;
    var resumeMs = 6000;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var inView = false;
    var userPaused = false;

    function goToSlide(index, smooth) {
      var target = slides[index];
      if (!target) return;
      activeIndex = index;
      track.scrollTo({
        left: target.offsetLeft - track.offsetLeft,
        behavior: smooth === false || reduceMotion ? "auto" : "smooth",
      });
      dots.forEach(function (dot, i) {
        var active = i === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", active ? "true" : "false");
      });
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (reduceMotion || userPaused || !inView || slides.length < 2) return;
      autoplayTimer = setInterval(function () {
        goToSlide((activeIndex + 1) % slides.length, true);
      }, autoplayMs);
    }

    function pauseForUser() {
      userPaused = true;
      stopAutoplay();
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () {
        userPaused = false;
        startAutoplay();
      }, resumeMs);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var index = parseInt(dot.getAttribute("data-slide"), 10);
        goToSlide(index, true);
        pauseForUser();
      });
    });

    var carouselObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            var index = Array.prototype.indexOf.call(slides, entry.target);
            if (index >= 0) activeIndex = index;
            dots.forEach(function (dot, i) {
              var active = i === index;
              dot.classList.toggle("is-active", active);
              dot.setAttribute("aria-selected", active ? "true" : "false");
            });
          }
        });
      },
      { root: track, threshold: [0.6] }
    );

    slides.forEach(function (slide) {
      carouselObserver.observe(slide);
    });

    track.addEventListener("pointerdown", pauseForUser);
    track.addEventListener("touchstart", pauseForUser, { passive: true });
    track.addEventListener("wheel", pauseForUser, { passive: true });
    track.addEventListener("keydown", pauseForUser);
    track.addEventListener("mouseenter", stopAutoplay);
    track.addEventListener("mouseleave", function () {
      if (!userPaused) startAutoplay();
    });

    var section = track.closest(".jo-section") || track;
    var visibilityObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          inView = entry.isIntersecting;
          if (inView) startAutoplay();
          else stopAutoplay();
        });
      },
      { threshold: 0.35 }
    );
    visibilityObserver.observe(section);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });
  }

  // ── FAQ accordion ──
  document.querySelectorAll(".jo-faq-item").forEach(function (item) {
    var btn = item.querySelector(".jo-faq-btn");
    btn.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // ── Scroll reveal ──
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = parseInt(entry.target.getAttribute("data-reveal-delay") || "0", 10);
            if (delay > 0) {
              setTimeout(function () {
                entry.target.classList.add("is-visible");
              }, delay);
            } else {
              entry.target.classList.add("is-visible");
            }
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".jo-reveal").forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll(".jo-reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
