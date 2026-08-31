(() => {
  const supabaseConfig = window.SUPABASE_CONFIG || {};
  const supabaseClient = window.supabase && supabaseConfig.url && supabaseConfig.anonKey
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
    : null;
  window.studySupabaseClient = supabaseClient;

  const modalMarkup = `
    <div class="auth-modal" id="auth-modal" hidden>
      <div class="auth-backdrop" data-auth-close></div>
      <section class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button class="auth-close" type="button" aria-label="Close sign in dialog" data-auth-close>&times;</button>
        <div class="auth-intro">
          <span class="auth-kicker">Commerce Study Connect</span>
          <h2 id="auth-title">Welcome back</h2>
          <p id="auth-description">Sign in to pick up where you left off.</p>
        </div>
        <div class="auth-tabs" role="tablist" aria-label="Account access">
          <button class="auth-tab is-active" type="button" role="tab" aria-selected="true" data-auth-tab="signin">Sign In</button>
          <button class="auth-tab" type="button" role="tab" aria-selected="false" data-auth-tab="signup">Create Account</button>
        </div>
        <form class="auth-form" id="signin-form">
          <div class="auth-field">
            <label for="signin-email">Email</label>
            <input type="text" id="signin-email" name="identity" placeholder="you@example.com" autocomplete="username" required />
          </div>
          <div class="auth-field">
            <label for="signin-password">Password or Code</label>
            <div class="auth-password-field">
              <input type="password" id="signin-password" name="password" placeholder="Enter your password" autocomplete="current-password" required />
              <button type="button" class="password-toggle" aria-label="Show password" data-password-toggle="signin-password">Show</button>
            </div>
          </div>
          <button class="btn btn-primary auth-submit" type="submit">Sign In</button>
          <p class="auth-message" role="status" aria-live="polite"></p>
        </form>
        <form class="auth-form" id="signup-form" hidden>
          <div class="auth-field">
            <label for="signup-name">Full Name</label>
            <input type="text" id="signup-name" name="name" placeholder="Enter your name" autocomplete="name" required />
          </div>
          <div class="auth-field">
            <label for="signup-email">Email</label>
            <input type="text" id="signup-email" name="identity" placeholder="Create your unique ID or email" autocomplete="username" required />
          </div>
          <div class="auth-field">
            <label for="signup-password">Password or Code</label>
            <div class="auth-password-field">
              <input type="password" id="signup-password" name="password" placeholder="Create a password" autocomplete="new-password" minlength="6" required />
              <button type="button" class="password-toggle" aria-label="Show password" data-password-toggle="signup-password">Show</button>
            </div>
          </div>
          <button class="btn btn-primary auth-submit" type="submit">Create Account</button>
          <p class="auth-message" role="status" aria-live="polite"></p>
        </form>
        <p class="auth-privacy">By continuing, you agree to our terms and privacy policy.</p>
      </section>
    </div>`;

  const init = () => {
    const socialIconAssets = {
      whatsapp: "https://cdn.simpleicons.org/whatsapp/25D366",
      telegram: "https://cdn.simpleicons.org/telegram/26A5E4",
      instagram: "https://cdn.simpleicons.org/instagram/E4405F"
    };

    document.querySelectorAll(".footer-socials a").forEach((link) => {
      const iconName = link.getAttribute("aria-label")?.toLowerCase();
      const iconSource = socialIconAssets[iconName];
      if (!iconSource) return;
      link.querySelector("svg")?.remove();
      if (!link.querySelector("img")) {
        link.insertAdjacentHTML(
          "afterbegin",
          `<img src="${iconSource}" alt="" aria-hidden="true" />`
        );
      }
    });

    document.body.insertAdjacentHTML("beforeend", modalMarkup);
    const modal = document.querySelector("#auth-modal");
    const dialog = modal.querySelector(".auth-dialog");
    const title = modal.querySelector("#auth-title");
    const description = modal.querySelector("#auth-description");
    const tabs = [...modal.querySelectorAll("[data-auth-tab]")];
    const forms = [...modal.querySelectorAll(".auth-form")];
    const accountTriggers = [...document.querySelectorAll(".auth-trigger")];
    let lastTrigger;

    const accountMenus = accountTriggers.map((trigger) => {
      const wrapper = document.createElement("div");
      wrapper.className = "account-menu";
      trigger.parentNode.insertBefore(wrapper, trigger);
      wrapper.appendChild(trigger);
      wrapper.insertAdjacentHTML("beforeend", `
        <div class="account-dropdown" hidden>
          <a href="profile.html" data-account-option="profile">My Profile</a>
          <a href="performance.html" data-account-option="performance">Performance</a>
          <button type="button" data-account-signout>Sign Out</button>
        </div>`);
      return {
        trigger,
        wrapper,
        dropdown: wrapper.querySelector(".account-dropdown")
      };
    });

    const updateAccountUI = (session) => {
      accountMenus.forEach(({ trigger, dropdown }) => {
        const signedIn = Boolean(session);
        trigger.textContent = signedIn ? "My Account" : "Sign In";
        trigger.classList.toggle("is-account", signedIn);
        trigger.setAttribute("aria-expanded", "false");
        dropdown.hidden = true;
      });
      document.dispatchEvent(new CustomEvent("study-auth-state", {
        detail: { session }
      }));
    };

    const closeAccountMenus = () => {
      accountMenus.forEach(({ trigger, dropdown }) => {
        dropdown.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      });
    };

    const setMode = (mode) => {
      const isSignup = mode === "signup";
      title.textContent = isSignup ? "Start learning with us" : "Welcome back";
      description.textContent = isSignup
        ? "Create your account and keep your progress in one place."
        : "Sign in to pick up where you left off.";
      tabs.forEach((tab) => {
        const active = tab.dataset.authTab === mode;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      forms.forEach((form) => {
        form.hidden = form.id !== `${mode}-form`;
        form.querySelector(".auth-message").textContent = "";
      });
    };

    const close = () => {
      modal.hidden = true;
      document.body.classList.remove("auth-open");
      lastTrigger?.focus();
    };

    const open = (mode, trigger) => {
      lastTrigger = trigger;
      setMode(mode || "signin");
      modal.hidden = false;
      document.body.classList.add("auth-open");
      window.requestAnimationFrame(() => dialog.querySelector("input")?.focus());
    };

    accountMenus.forEach(({ trigger, wrapper, dropdown }) => {
      wrapper.addEventListener("mouseenter", () => {
        if (trigger.classList.contains("is-account")) dropdown.hidden = false;
      });
      wrapper.addEventListener("mouseleave", () => {
        dropdown.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      });
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        if (trigger.classList.contains("is-account")) {
          const isOpen = !dropdown.hidden;
          closeAccountMenus();
          dropdown.hidden = isOpen;
          trigger.setAttribute("aria-expanded", String(!isOpen));
          return;
        }
        open(trigger.dataset.authMode, trigger);
      });
      dropdown.addEventListener("click", async (event) => {
        const signOut = event.target.closest("[data-account-signout]");
        if (!signOut) return;
        signOut.disabled = true;
        const { error } = await supabaseClient.auth.signOut();
        signOut.disabled = false;
        if (error) return;
        closeAccountMenus();
      });
    });
    modal.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-auth-close]");
      if (closeButton) close();
      const tab = event.target.closest("[data-auth-tab]");
      if (tab) setMode(tab.dataset.authTab);
      const passwordToggle = event.target.closest("[data-password-toggle]");
      if (passwordToggle) {
        const input = document.getElementById(passwordToggle.dataset.passwordToggle);
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        passwordToggle.textContent = isPassword ? "Hide" : "Show";
        passwordToggle.setAttribute("aria-label", `${isPassword ? "Hide" : "Show"} password`);
      }
    });
    forms.forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const message = form.querySelector(".auth-message");
        const submitButton = form.querySelector("[type=submit]");
        const formData = new FormData(form);
        const identity = String(formData.get("identity") || "").trim();
        const password = String(formData.get("password") || "");

        if (!supabaseClient) {
          message.textContent = "Supabase is not configured yet. Add your project URL and publishable key to supabase-config.js.";
          return;
        }

        submitButton.disabled = true;
        message.textContent = "Connecting...";

        const result = form.id === "signup-form"
          ? await supabaseClient.auth.signUp({
              email: identity,
              password,
              options: { data: { full_name: String(formData.get("name") || "").trim() } }
            })
          : await supabaseClient.auth.signInWithPassword({ email: identity, password });

        submitButton.disabled = false;
        if (result.error) {
          message.textContent = result.error.message;
          return;
        }

        if (result.data.session) {
          updateAccountUI(result.data.session);
          close();
          return;
        }

        message.textContent = "Account created. Check your email to confirm your account.";
      });
    });
    if (supabaseClient) {
      supabaseClient.auth.getSession().then(({ data }) => updateAccountUI(data.session));
      supabaseClient.auth.onAuthStateChange((_event, session) => updateAccountUI(session));
    } else {
      updateAccountUI(null);
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) close();
      if (event.key === "Escape") closeAccountMenus();
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
