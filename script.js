// Game State Variables
let secretCode = [];
let userGuess = [];
let currentInputIndex = 0; // for focus
let roundCount = 0;
let gameWon = false;
let currentDifficulty = "hard";
let codeLength = 4; // for input block based on currentDifficulty

// Detect mobile-ish devices: combine userAgent + pointer heuristics
const isMobile =
  /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
  (typeof window !== "undefined" &&
    "ontouchstart" in window &&
    navigator.maxTouchPoints > 0 &&
    window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches);

// DOM Elements
const inputBlocks = document.querySelectorAll(".pin-input-block");
const pinInputFields = document.getElementById("pin-input-fields");
const virtualKeyboard = document.getElementById("virtual-keyboard");
const submitGuessButton = document.getElementById("submit-guess-button");
const newGameButton = document.getElementById("new-game-button");
const feedbackMessage = document.getElementById("feedback-message");
const roundDisplay = document.getElementById("round-display");
const guessHistoryList = document.getElementById("guess-history-list");
const easyBtn = document.getElementById("easy-btn");
const hardBtn = document.getElementById("hard-btn");

// Game Initialization
function initializeGame() {
  gameWon = false;
  roundCount = 0;
  codeLength = currentDifficulty === "hard" ? 4 : 3;
  userGuess = Array(codeLength).fill("");
  currentInputIndex = 0;
  secretCode = generateSecretCode();

  console.log(
    `Difficulty: ${currentDifficulty}, Code (${codeLength}-digits):`,
    secretCode.join("")
  );

  // Update UI for 3 or 4 digits
  inputBlocks.forEach((block, index) => {
    block.classList.toggle("hidden", index >= codeLength);
  });

  renderInputState(); // Update input fields and highlight
  updateRoundDisplay();
  feedbackMessage.textContent = ""; // Clear previous messages
  guessHistoryList.innerHTML = ""; // Clear previous guesses history
  submitGuessButton.disabled = true; // Disable submit until all digits are entered
  newGameButton.classList.add("hidden"); // Hide "Play Again" button

  // Re-enable game controls
  pinInputFields.classList.remove("pointer-events-none", "opacity-50");
  virtualKeyboard.classList.remove("pointer-events-none", "opacity-50");

  // Update difficulty button styles
  easyBtn.classList.toggle("active", currentDifficulty === "easy");
  hardBtn.classList.toggle("active", currentDifficulty === "hard");
}

// --- Helper Functions ---

// Generates a secret code based on current difficulty
function generateSecretCode() {
  const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  let code = [];

  if (currentDifficulty === "hard") {
    // Hard Mode: 4 unique digits
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]]; // Fisher-Yates shuffle
    }
    code = digits.slice(0, codeLength); // 4 digits
  } else {
    // Easy Mode: 3 digits with duplicates allowed
    for (let i = 0; i < codeLength; i++) {
      code.push(digits[Math.floor(Math.random() * digits.length)]);
    }
  }
  return code;
}

// Renders the current state of userGuess to the input blocks
function renderInputState() {
  inputBlocks.forEach((block, index) => {
    if (index >= codeLength) return; // Don't try to render hidden blocks

    block.value = userGuess[index];
    block.classList.remove("active-input");

    // On mobile keep readonly always (prevents on-screen keyboard)
    if (isMobile) {
      block.setAttribute("readonly", "true");
    } else {
      // Desktop: allow editing the active input only
      if (index === currentInputIndex && !gameWon) {
        block.removeAttribute("readonly");
      } else {
        block.setAttribute("readonly", "true");
      }
    }
  });

  // Highlight the current active input block if not won
  if (!gameWon && currentInputIndex < codeLength) {
    inputBlocks[currentInputIndex].classList.add("active-input");
    // Only call focus on desktop — focusing on mobile might still trigger keyboard in odd cases
    if (!isMobile) {
      inputBlocks[currentInputIndex].focus();
    }
  } else if (!gameWon && currentInputIndex === codeLength) {
    // All fields filled, keep focus on last block (desktop only)
    inputBlocks[codeLength - 1].classList.add("active-input");
    if (!isMobile) {
      inputBlocks[codeLength - 1].focus();
    }
  }

  // Enable/disable submit button
  const isAllFilled = userGuess.every((digit) => digit !== "");
  submitGuessButton.disabled = !isAllFilled || gameWon;
}

// Updates the round display
function updateRoundDisplay() {
  roundDisplay.textContent = `Round: ${roundCount}`;
}

// Calculates feedback (Bulls and Cows) - ROBUST FOR DUPLICATES
function calculateFeedback(guess, code) {
  let correctPositions = 0; // Bulls
  let correctNumbers = 0; // Cows

  const codeFreq = {};
  for (const digit of code) {
    codeFreq[digit] = (codeFreq[digit] || 0) + 1;
  }

  let tempGuess = [...guess];

  // First pass: find Bulls (correct position)
  for (let i = 0; i < codeLength; i++) {
    if (tempGuess[i] === code[i]) {
      correctPositions++;
      codeFreq[tempGuess[i]]--;
      tempGuess[i] = null; // Mark guess as used (for Bull)
    }
  }

  // Second pass: find Cows (correct number, wrong position)
  for (let i = 0; i < codeLength; i++) {
    if (tempGuess[i] !== null && codeFreq[tempGuess[i]] > 0) {
      correctNumbers++;
      codeFreq[tempGuess[i]]--;
    }
  }

  return { correctNumbers, correctPositions };
}

// Adds a guess entry to the history section
function addGuessToHistory(guess, bulls, cows) {
  const guessEntryDiv = document.createElement("div");
  guessEntryDiv.classList.add(
    "bg-gray-50",
    "p-3",
    "rounded-lg",
    "shadow-sm",
    "flex",
    "justify-between",
    "items-center",
    "border",
    "border-gray-200"
  );

  const guessNumberSpan = document.createElement("span");
  guessNumberSpan.classList.add(
    "text-2xl",
    "font-semibold",
    "text-gray-800",
    "tracking-widest",
    "font-mono"
  );
  guessNumberSpan.textContent = guess.join("");

  const feedbackSpan = document.createElement("span");
  feedbackSpan.classList.add("text-lg", "font-medium");
  feedbackSpan.innerHTML = `<span class="text-red-500 font-bold">Bulls-${bulls}</span> <span class="text-blue-500 font-bold">Cows-${cows}</span>`;

  guessEntryDiv.appendChild(guessNumberSpan);
  guessEntryDiv.appendChild(feedbackSpan);

  guessHistoryList.prepend(guessEntryDiv); // Add to the top
}

// Temporarily shows a message in the feedback area
function showTempFeedback(message, isError = true) {
  const color = isError ? "text-red-600" : "text-blue-600";
  feedbackMessage.innerHTML = `<span class="${color}">${message}</span>`;
  setTimeout(() => {
    if (!gameWon) feedbackMessage.textContent = ""; // Clear message after 2s
  }, 2000);
}

// --- Event Handlers ---

// Handle clicks on virtual keyboard buttons
virtualKeyboard.addEventListener("click", (event) => {
  if (gameWon) return;

  const clickedButton = event.target.closest("button");
  if (!clickedButton) return;

  const value = clickedButton.dataset.value;

  if (value === "backspace") {
    if (currentInputIndex === codeLength) {
      // If all fields full, move back
      currentInputIndex--;
    }
    if (currentInputIndex > 0) {
      currentInputIndex--;
      userGuess[currentInputIndex] = "";
    } else if (currentInputIndex === 0 && userGuess[0] !== "") {
      userGuess[0] = "";
    }
  } else if (value >= "0" && value <= "9") {
    // It's a number

    // --- Duplicate Check for Hard Mode ---
    if (currentDifficulty === "hard") {
      const isAlreadyInGuess = userGuess.some(
        (digit, index) => digit === value
      );
      const isOverwritingItself =
        currentInputIndex < codeLength &&
        userGuess[currentInputIndex] === value;

      if (isAlreadyInGuess && !isOverwritingItself) {
        showTempFeedback("Duplicate digits not allowed in Hard mode!");
        return; // Stop processing input
      }
    }
    // --- End Duplicate Check ---

    if (currentInputIndex < codeLength) {
      userGuess[currentInputIndex] = value;
      currentInputIndex++;
    }
  }

  currentInputIndex = Math.min(Math.max(0, currentInputIndex), codeLength);
  renderInputState();
});

// Handle clicks on input blocks (works on both mobile and desktop)
inputBlocks.forEach((block, index) => {
  block.addEventListener("click", () => {
    if (gameWon || index >= codeLength) return;
    currentInputIndex = index;
    renderInputState();
  });
});

// Attach keydown handlers ONLY on non-mobile devices
if (!isMobile) {
  inputBlocks.forEach((block, index) => {
    block.addEventListener("keydown", (event) => {
      if (gameWon || index >= codeLength) return;

      const key = event.key;
      const currentIndex = parseInt(event.target.dataset.index);

      if (key >= "0" && key <= "9") {
        // --- Duplicate Check for Hard Mode (Physical Keyboard) ---
        if (currentDifficulty === "hard") {
          const isAlreadyInGuess = userGuess.some(
            (digit, i) => digit === key && i !== currentIndex
          );
          if (isAlreadyInGuess) {
            showTempFeedback("Duplicate digits not allowed in Hard mode!");
            event.preventDefault();
            return;
          }
        }
        // --- End Duplicate Check ---

        userGuess[currentIndex] = key;
        if (currentIndex < codeLength - 1) {
          currentInputIndex = currentIndex + 1;
        } else {
          currentInputIndex = codeLength; // All filled
        }
        event.preventDefault();
      } else if (key === "Backspace") {
        event.preventDefault();
        if (userGuess[currentIndex] !== "") {
          userGuess[currentIndex] = "";
        } else if (currentIndex > 0) {
          currentInputIndex = currentIndex - 1;
          userGuess[currentInputIndex] = "";
        }
      } else if (key === "ArrowRight" && currentIndex < codeLength - 1) {
        currentInputIndex = currentIndex + 1;
      } else if (key === "ArrowLeft" && currentIndex > 0) {
        currentInputIndex = currentIndex - 1;
      } else {
        event.preventDefault(); // Prevent other keys
      }
      renderInputState();
    });
  });
}

// Handle submit guess button click
submitGuessButton.addEventListener("click", () => {
  if (gameWon || !userGuess.every((digit) => digit !== "")) return;

  roundCount++;
  updateRoundDisplay();

  const { correctNumbers, correctPositions } = calculateFeedback(
    userGuess,
    secretCode
  );

  addGuessToHistory(userGuess, correctPositions, correctNumbers);

  if (correctPositions === codeLength) {
    // Check win condition
    gameWon = true;
    feedbackMessage.innerHTML = `<span class="text-green-700 font-bold">Congratulations! You guessed the code <span class="text-blue-600">${secretCode.join(
      ""
    )}</span> in ${roundCount} rounds!</span>`;
    submitGuessButton.disabled = true;
    newGameButton.classList.remove("hidden");

    // Disable game inputs
    pinInputFields.classList.add("pointer-events-none", "opacity-50");
    virtualKeyboard.classList.add("pointer-events-none", "opacity-50");
  } else {
    let message = `You have <span class="font-bold">${correctNumbers}</span> cow${
      correctNumbers !== 1 ? "s" : ""
    } and <span class="font-bold">${correctPositions}</span> bull${
      correctPositions !== 1 ? "s" : ""
    }.`;
    if (correctNumbers === 0 && correctPositions === 0) {
      message = `No correct digits. Keep trying!`;
    }
    feedbackMessage.innerHTML = `<span class="text-red-600">${message} (Round ${roundCount})</span>`;

    // Prepare for next guess
    userGuess = Array(codeLength).fill("");
    currentInputIndex = 0;
    renderInputState(); // Clear inputs for next round
  }
});

// Handle new game button click
newGameButton.addEventListener("click", initializeGame);

// Handle difficulty selection
easyBtn.addEventListener("click", () => {
  currentDifficulty = "easy";
  initializeGame();
});

hardBtn.addEventListener("click", () => {
  currentDifficulty = "hard";
  initializeGame();
});

// --- Initial Game Setup when page loads ---
initializeGame();
