// Game State Variables
let secretCode = [];
let userGuess = [];
let currentInputIndex = 0; // for focus
let roundCount = 1;
let gameWon = false;
let currentDifficulty = "hard";
let codeLength = 4; // for input block based on currentDifficulty

// Detect mobile
const isMobile =
  /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
  (typeof window !== "undefined" &&
    "ontouchstart" in window &&
    navigator.maxTouchPoints > 0 &&
    window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches);

// DOM elements
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

//game initialization
function initializeGame() {
  gameWon = false;
  roundCount = 0;
  codeLength = currentDifficulty === "hard" ? 4 : 3;
  userGuess = Array(codeLength).fill("");
  currentInputIndex = 0;
  secretCode = generateSecretCode();

  //DELETE THIS LATER IDIOT
  console.log(
    `Difficulty: ${currentDifficulty}, Code (${codeLength}-digits):`,
    secretCode.join("")
  );

  // Update UI for 3 or 4 digits
  inputBlocks.forEach((block, index) => {
    block.classList.toggle("hidden", index >= codeLength);
  });

  renderInputState(); // Update input and focus
  updateRoundDisplay();
  feedbackMessage.textContent = ""; // clear previous messages
  guessHistoryList.innerHTML = ""; // clear previous guesses history
  submitGuessButton.disabled = true; // disable submit until all filled
  newGameButton.classList.add("hidden"); // hide until win

  //enable button for page reload and after press win
  pinInputFields.classList.remove("pointer-events-none", "opacity-50");
  virtualKeyboard.classList.remove("pointer-events-none", "opacity-50");

  // Update difficulty button styles
  easyBtn.classList.toggle("active", currentDifficulty === "easy");
  hardBtn.classList.toggle("active", currentDifficulty === "hard");
}

//secret code based on difficulty
function generateSecretCode() {
  const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  let code = [];

  if (currentDifficulty === "hard") {
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    code = digits.slice(0, codeLength);
  } else {
    for (let i = 0; i < codeLength; i++) {
      code.push(digits[Math.floor(Math.random() * digits.length)]);
    }
  }
  return code;
}

function renderInputState() {
  inputBlocks.forEach((block, index) => {
    if (index >= codeLength) return; //for hiding last blocks

    block.value = userGuess[index];
    block.classList.remove("active-input");

    //hide keyboard for mobile only
    if (isMobile) {
      block.setAttribute("readonly", "true");
    } else {
      if (index === currentInputIndex && !gameWon) {
        block.removeAttribute("readonly");
      } else {
        block.setAttribute("readonly", "true");
      }
    }
  });

  //for focus
  if (!gameWon && currentInputIndex < codeLength) {
    inputBlocks[currentInputIndex].classList.add("active-input");
    if (!isMobile) {
      inputBlocks[currentInputIndex].focus();
    }
  } else if (!gameWon && currentInputIndex === codeLength) {
    inputBlocks[codeLength - 1].classList.add("active-input");
    if (!isMobile) {
      inputBlocks[codeLength - 1].focus();
    }
  }

  const isAllFilled = userGuess.every((digit) => digit !== "");
  submitGuessButton.disabled = !isAllFilled || gameWon;
}

function updateRoundDisplay() {
  roundDisplay.textContent = `Round: ${roundCount}`;
}

function calculateFeedback(guess, code) {
  let correctPositions = 0; //Bulls
  let correctNumbers = 0; //cows

  const codeFreq = {};
  for (const digit of code) {
    codeFreq[digit] = (codeFreq[digit] || 0) + 1;
  }

  let tempGuess = [...guess];

  for (let i = 0; i < codeLength; i++) {
    if (tempGuess[i] === code[i]) {
      correctPositions++;
      codeFreq[tempGuess[i]]--;
      tempGuess[i] = null;
    }
  }

  for (let i = 0; i < codeLength; i++) {
    if (tempGuess[i] !== null && codeFreq[tempGuess[i]] > 0) {
      correctNumbers++;
      codeFreq[tempGuess[i]]--;
    }
  }

  return { correctNumbers, correctPositions };
}

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

  guessHistoryList.prepend(guessEntryDiv);
}

function showTempFeedback(message, isError = true) {
  const color = isError ? "text-red-600" : "text-blue-600";
  feedbackMessage.innerHTML = `<span class="${color}">${message}</span>`;
  setTimeout(() => {
    if (!gameWon) feedbackMessage.textContent = "";
  }, 2000);
}

// Handle btn clicks in virtual keyboard
virtualKeyboard.addEventListener("click", (event) => {
  if (gameWon) return;

  const clickedButton = event.target.closest("button");
  if (!clickedButton) return;

  const value = clickedButton.dataset.value;

  if (value === "backspace") {
    if (currentInputIndex === codeLength) {
      currentInputIndex--;
    }
    if (currentInputIndex > 0) {
      currentInputIndex--;
      userGuess[currentInputIndex] = "";
    } else if (currentInputIndex === 0 && userGuess[0] !== "") {
      userGuess[0] = "";
    }
  } else if (value >= "0" && value <= "9") {
    //Duplicate entry
    if (currentDifficulty === "hard") {
      const isAlreadyInGuess = userGuess.some(
        (digit, index) => digit === value
      );
      const isOverwritingItself =
        currentInputIndex < codeLength &&
        userGuess[currentInputIndex] === value;

      if (isAlreadyInGuess && !isOverwritingItself) {
        showTempFeedback("Duplicate digits not allowed in Hard mode!");
        return; //stop
      }
    }

    if (currentInputIndex < codeLength) {
      userGuess[currentInputIndex] = value;
      currentInputIndex++;
    }
  }

  currentInputIndex = Math.min(Math.max(0, currentInputIndex), codeLength);
  renderInputState();
});

// handle click in input block
inputBlocks.forEach((block, index) => {
  block.addEventListener("click", () => {
    if (gameWon || index >= codeLength) return;
    currentInputIndex = index;
    renderInputState();
  });
});

// keydown handle in laptop
if (!isMobile) {
  inputBlocks.forEach((block, index) => {
    block.addEventListener("keydown", (event) => {
      if (gameWon || index >= codeLength) return;

      const key = event.key;
      const currentIndex = parseInt(event.target.dataset.index);

      if (key >= "0" && key <= "9") {
        //dupicate entry check
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

        userGuess[currentIndex] = key;
        if (currentIndex < codeLength - 1) {
          currentInputIndex = currentIndex + 1;
        } else {
          currentInputIndex = codeLength;
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
        event.preventDefault(); //block other keys
      }
      renderInputState();
    });
  });
}

//handle submit button
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
    // check win condition
    gameWon = true;
    feedbackMessage.innerHTML = `<span class="text-green-700 font-bold">Congratulations! You guessed the code <span class="text-blue-600">${secretCode.join(
      ""
    )}</span> in ${roundCount} rounds!</span>`;
    submitGuessButton.disabled = true;
    newGameButton.classList.remove("hidden");

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
    feedbackMessage.innerHTML = `<span class="text-red-600">${message}</span>`;

    //for next round
    userGuess = Array(codeLength).fill("");
    currentInputIndex = 0;
    renderInputState(); //clear inputs
  }
});

// handle new game btn
newGameButton.addEventListener("click", initializeGame);

// handle level
easyBtn.addEventListener("click", () => {
  currentDifficulty = "easy";
  initializeGame();
});

hardBtn.addEventListener("click", () => {
  currentDifficulty = "hard";
  initializeGame();
});

//Initial on page loads
initializeGame();
