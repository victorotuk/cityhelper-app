"use strict";

// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://qyisjxfugogimgzhualw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aXNqeGZ1Z29naW1nemh1YWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzIzNjIsImV4cCI6MjA4MTA0ODM2Mn0.gPFhYFYhGoI_3IAc65XuJc-xMY2MS3kS65Fg16GX45U';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// APP STATE
// ============================================
let currentUser = null;
let selectedChoice = null;

// ============================================
// MAIN APP LOGIC
// ============================================
document.addEventListener("DOMContentLoaded", async function () {
  const steps = document.querySelectorAll(".app-step");
  const progressFill = document.getElementById("progress-fill");
  const totalSteps = 4;

  // Check for existing session (e.g., after OAuth redirect)
  await checkSession();

  function showStep(stepNumber) {
    stepNumber = parseInt(stepNumber, 10);
    
    steps.forEach(function (step) {
      const n = parseInt(step.getAttribute("data-step"), 10);
      step.classList.toggle("is-active", n === stepNumber);
    });
    
    // Update progress bar
    const progress = (stepNumber / totalSteps) * 100;
    if (progressFill) {
      progressFill.style.width = progress + '%';
    }

    // Update summary on step 3
    if (stepNumber === 3) {
      updateSummary();
    }
    
    // Scroll to top of app container
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Navigation buttons (next/prev)
  document.body.addEventListener("click", function (event) {
    const target = event.target.closest("[data-next-step]");
    const prevTarget = event.target.closest("[data-prev-step]");

    if (target) {
      const next = target.getAttribute("data-next-step");
      showStep(next);
    }

    if (prevTarget) {
      const prev = prevTarget.getAttribute("data-prev-step");
      showStep(prev);
    }
  });

  // Choice selection (step 1)
  const choiceOptions = document.querySelectorAll(".choice-option");
  const ghostOption = document.querySelector('[data-choice="ghost"]');
  const googleSignInBtn = document.getElementById("google-signin-btn");

  // Ghost mode selection
  if (ghostOption) {
    ghostOption.addEventListener("click", function () {
      choiceOptions.forEach(o => o.classList.remove("is-selected"));
      ghostOption.classList.add("is-selected");
      selectedChoice = "ghost";
    });
  }

  // Google Sign-In
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", async function () {
      // If already signed in, just select and continue
      if (currentUser) {
        choiceOptions.forEach(o => o.classList.remove("is-selected"));
        googleSignInBtn.classList.add("is-selected");
        selectedChoice = "return";
        return;
      }

      // Trigger Google OAuth
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });

      if (error) {
        console.error('OAuth error:', error);
        alert('Sign-in failed. Please try again.');
      }
      // User will be redirected to Google, then back
    });
  }

  // Summary update function
  function updateSummary() {
    const contextSelect = document.getElementById("context-type");
    const horizonSelect = document.getElementById("time-horizon");
    const textArea = document.getElementById("situation-text");

    const summaryContext = document.getElementById("summary-context");
    const summaryHorizon = document.getElementById("summary-horizon");
    const summaryText = document.getElementById("summary-text");

    if (!summaryContext || !summaryHorizon || !summaryText) {
      return;
    }

    // Get context label
    let contextLabel = "—";
    if (contextSelect && contextSelect.value) {
      const ctxOption = contextSelect.options[contextSelect.selectedIndex];
      contextLabel = ctxOption ? ctxOption.text : "—";
    }

    // Get horizon label
    let horizonLabel = "The next few days";
    if (horizonSelect) {
      const hzOption = horizonSelect.options[horizonSelect.selectedIndex];
      horizonLabel = hzOption ? hzOption.text : "The next few days";
    }

    // Get story text
    const story = textArea && textArea.value.trim() ? textArea.value.trim() : "";

    summaryContext.textContent = contextLabel;
    summaryHorizon.textContent = horizonLabel;

    if (story) {
      summaryText.textContent = story;
    } else {
      summaryText.textContent = "You haven't written anything yet.";
    }
  }

  // Submit button - now sends to Supabase
  const fakeSubmitButton = document.getElementById("fake-submit-button");
  if (fakeSubmitButton) {
    fakeSubmitButton.addEventListener("click", async function () {
      const contextSelect = document.getElementById("context-type");
      const horizonSelect = document.getElementById("time-horizon");
      const textArea = document.getElementById("situation-text");

      const submissionData = {
        privacy_mode: selectedChoice || 'ghost',
        context_type: contextSelect ? contextSelect.value : null,
        situation_text: textArea ? textArea.value.trim() : '',
        time_horizon: horizonSelect ? horizonSelect.value : 'immediate',
        user_id: currentUser ? currentUser.id : null,
        email: currentUser ? currentUser.email : null,
        status: 'pending'
      };

      // Only submit if there's actual content
      if (!submissionData.situation_text) {
        alert("Please describe your situation first.");
        showStep(2);
        return;
      }

      // Submit to Supabase
      try {
        fakeSubmitButton.disabled = true;
        fakeSubmitButton.textContent = 'Sending...';

        const { data, error } = await supabaseClient
          .from('submissions')
          .insert([submissionData])
          .select();

        if (error) {
          console.error('Submission error:', error);
          // If table doesn't exist yet, still show confirmation (for demo)
          if (error.code === '42P01') {
            console.warn('Table does not exist yet - showing demo confirmation');
          } else {
            alert('Something went wrong. Please try again.');
            fakeSubmitButton.disabled = false;
            fakeSubmitButton.textContent = 'Send for analysis →';
            return;
          }
        } else {
          console.log('Submission saved:', data);
        }

        // Go to confirmation step
        showStep(4);
      } catch (err) {
        console.error('Error:', err);
        // Show confirmation anyway for demo
        showStep(4);
      } finally {
        fakeSubmitButton.disabled = false;
        fakeSubmitButton.innerHTML = 'Send for analysis <span class="button-arrow">→</span>';
      }
    });
  }

  // Start over button
  const startOverButton = document.getElementById("start-over-button");
  if (startOverButton) {
    startOverButton.addEventListener("click", function () {
      // Reset form
      const form = document.getElementById("situation-form");
      if (form) {
        form.reset();
      }
      
      // Reset choice selection (but keep user logged in)
      choiceOptions.forEach(o => o.classList.remove("is-selected"));
      if (!currentUser) {
        selectedChoice = null;
      }
      
      // Go back to step 1
      showStep(1);
    });
  }

  // Auto-save to localStorage (ghost mode only now, signed-in users save to Supabase)
  const textArea = document.getElementById("situation-text");
  if (textArea && !currentUser) {
    // Load saved text if exists
    const saved = localStorage.getItem("ph-draft-text");
    if (saved) {
      textArea.value = saved;
    }
    
    // Save on input
    textArea.addEventListener("input", function () {
      if (selectedChoice === "ghost") {
        localStorage.setItem("ph-draft-text", textArea.value);
      }
    });
  }

  // Initialize
  showStep(1);

  // ============================================
  // AUTH FUNCTIONS
  // ============================================
  async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session && session.user) {
      currentUser = session.user;
      selectedChoice = "return";
      updateUIForSignedInUser();
      console.log('Signed in as:', currentUser.email);
    }

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        selectedChoice = "return";
        updateUIForSignedInUser();
        console.log('Auth state changed - signed in:', currentUser.email);
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        selectedChoice = null;
        updateUIForSignedOutUser();
      }
    });
  }

  function updateUIForSignedInUser() {
    const googleSignInBtn = document.getElementById("google-signin-btn");

    if (googleSignInBtn && currentUser) {
      // Update the button to show signed-in state
      googleSignInBtn.classList.add("is-selected");
      const nameEl = googleSignInBtn.querySelector(".choice-name");
      const descEl = googleSignInBtn.querySelector(".choice-desc");
      
      if (nameEl) {
        nameEl.textContent = `Signed in as ${currentUser.email.split('@')[0]}`;
      }
      if (descEl) {
        descEl.textContent = "Your submissions will be saved to your account.";
      }
    }
  }

  function updateUIForSignedOutUser() {
    const googleSignInBtn = document.getElementById("google-signin-btn");
    
    if (googleSignInBtn) {
      googleSignInBtn.classList.remove("is-selected");
      const nameEl = googleSignInBtn.querySelector(".choice-name");
      const descEl = googleSignInBtn.querySelector(".choice-desc");
      
      if (nameEl) {
        nameEl.textContent = "Sign in with Google";
      }
      if (descEl) {
        descEl.textContent = "Save your submissions and come back anytime.";
      }
    }
  }
});
