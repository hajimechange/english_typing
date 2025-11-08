// 厳格モード
"use strict";

// --- グローバル変数・定数 ---
const courses = {
    quizData: [],
    grammarQuizData: []
};

let progress = {
    quizData: { easy: 0, normal: 0, hard: 0 },
    grammarQuizData: { easy: 0, normal: 0, hard: 0 }
};

const GAME_SETTINGS = {
    easy:   { totalTime: 60, problemTime: 20, clearScore: 1000, name: "イージー" },
    normal: { totalTime: 90, problemTime: 10, clearScore: 3000, name: "ノーマル" },
    hard:   { totalTime: 90, problemTime: 10, clearScore: 5000, name: "ハード" }
};

// ゲーム状態
let currentMode = "easy";
let currentSessionKey = "quizData"; // "quizData" or "grammarQuizData"
let currentCourseIndex = 0;
let currentGameData = []; // 現在のコースの問題
let currentProblem = null;
let currentProblemIndex = 0;
let currentTypedIndex = 0; // 現在タイプ中の文字インデックス

// タイマーID
let gameTimerId = null;
let problemTimerId = null;

// スコア関連
let score = 0;
let typedChars = 0;
let misses = 0;
let isProblemPerfect = true;
let problemScore = 0;

// --- DOM要素 ---
const screens = {
    home: document.getElementById("home-screen"),
    game: document.getElementById("game-screen"),
    result: document.getElementById("result-screen")
};

const selectionContainers = {
    mode: document.getElementById("mode-selection"),
    session: document.getElementById("session-selection"),
    course: document.getElementById("course-selection")
};

// ゲーム画面要素
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const jaTextEl = document.getElementById("ja-text");
const enTextEl = document.getElementById("en-text");
const enTextHardContainer = document.getElementById("en-text-hard");
const inputBox = document.getElementById("input-box");

// 結果画面要素
const resultTitleEl = document.getElementById("result-title");
const resultMessageEl = document.getElementById("result-message");
const finalScoreEl = document.getElementById("final-score");
const totalTypedEl = document.getElementById("total-typed");
const missCountEl = document.getElementById("miss-count");

// --- 初期化処理 ---
document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
    // 1. 問題データをコース別に分割
    splitDataIntoCourses(allQuizData, 'quizData');
    splitDataIntoCourses(grammarQuizData, 'grammarQuizData');

    // 2. ブラウザから進捗をロード
    loadProgress();

    // 3. イベントリスナーを設定
    setupEventListeners();

    // 4. ホーム画面を初期表示 (モード選択)
    showHomeScreen("mode");
}

/**
 * 元データをカテゴリ別に分割して `courses` オブジェクトに格納
 * @param {Array} data - allQuizData or grammarQuizData
 * @param {String} key - "quizData" or "grammarQuizData"
 */
function splitDataIntoCourses(data, key) {
    const categories = [...new Set(data.map(item => item.category))];
    courses[key] = categories.map(category => {
        const problems = data.filter(item => item.category === category);
        return {
            name: category,
            problems: problems
        };
    });
}

/**
 * LocalStorageから進捗を読み込む
 */
function loadProgress() {
    const savedProgress = localStorage.getItem("typingGameProgress");
    if (savedProgress) {
        progress = JSON.parse(savedProgress);
    }
}

/**
 * 進捗をLocalStorageに保存
 */
function saveProgress() {
    const settings = GAME_SETTINGS[currentMode];
    if (score >= settings.clearScore) {
        // クリアしたコースインデックス
        const clearedIndex = currentCourseIndex;
        // 現在の最大クリアレベル
        const maxCleared = progress[currentSessionKey][currentMode];
        
        // 新しいクリアレベルが現在のレベル以上の場合のみ更新
        if (clearedIndex + 1 > maxCleared) {
            progress[currentSessionKey][currentMode] = clearedIndex + 1;
            localStorage.setItem("typingGameProgress", JSON.stringify(progress));
        }
    }
}

// --- イベントリスナー設定 ---
function setupEventListeners() {
    // モード選択
    document.querySelectorAll(".btn-mode").forEach(btn => {
        btn.addEventListener("click", () => selectMode(btn.dataset.mode));
    });

    // セッション選択
    document.querySelectorAll(".btn-session").forEach(btn => {
        btn.addEventListener("click", () => selectSession(btn.dataset.session));
    });

    // 戻るボタン
    document.querySelectorAll(".btn-back").forEach(btn => {
        btn.addEventListener("click", () => showHomeScreen(btn.dataset.target));
    });

    // ゲーム画面 -> ホームへ
    document.getElementById("home-btn").addEventListener("click", () => {
        if (confirm("ゲームを中断してホームに戻りますか？")) {
            endGame(true); // 強制終了
        }
    });

    // 結果画面 -> ホームへ
    document.getElementById("back-to-home-btn").addEventListener("click", () => {
        showScreen("home");
        showHomeScreen("mode"); // モード選択から
    });

    // タイピング入力
    inputBox.addEventListener("input", handleInput);
}

// --- 画面遷移ロジック ---

/**
 * 指定したIDの画面を表示
 * @param {String} screenId - "home", "game", "result"
 */
function showScreen(screenId) {
    Object.values(screens).forEach(screen => screen.classList.remove("active"));
    screens[screenId].classList.add("active");
}

/**
 * ホーム画面の表示を切り替え
 * @param {String} view - "mode", "session", "course"
 */
function showHomeScreen(view) {
    Object.values(selectionContainers).forEach(container => container.style.display = "none");
    if (view === "mode") {
        selectionContainers.mode.style.display = "flex";
    } else if (view === "session") {
        selectionContainers.session.style.display = "flex";
    } else if (view === "course") {
        selectionContainers.course.style.display = "flex";
        updateCourseDisplay(); // コース一覧を更新
    }
    showScreen("home");
}

/**
 * 1. モード選択
 * @param {String} mode - "easy", "normal", "hard"
 */
function selectMode(mode) {
    currentMode = mode;
    showHomeScreen("session");
}

/**
 * 2. セッション選択
 * @param {String} sessionKey - "quizData" or "grammarQuizData"
 */
function selectSession(sessionKey) {
    currentSessionKey = sessionKey;
    showHomeScreen("course");
}

/**
 * 3. コース一覧の表示（ロック/アンロック制御）
 */
function updateCourseDisplay() {
    const courseGrid = document.getElementById("course-grid");
    const courseTitle = document.getElementById("course-title");
    const sessionCourses = courses[currentSessionKey];
    const maxCleared = progress[currentSessionKey][currentMode];

    courseTitle.textContent = `${GAME_SETTINGS[currentMode].name} - コース選択`;
    courseGrid.innerHTML = ""; // いったん空に

    sessionCourses.forEach((course, index) => {
        const btn = document.createElement("button");
        btn.classList.add("btn", "course-btn");
        btn.textContent = `Course ${index + 1}: ${course.name.split('(')[0]}`; // (S+V)などを省略
        
        if (index <= maxCleared) {
            // アンロック状態
            btn.dataset.index = index;
            btn.addEventListener("click", () => selectCourse(index));
        } else {
            // ロック状態
            btn.classList.add("locked");
            btn.disabled = true;
        }
        courseGrid.appendChild(btn);
    });
}

/**
 * 4. コース選択 -> ゲーム開始
 * @param {Number} index 
 */
function selectCourse(index) {
    currentCourseIndex = index;
    currentGameData = courses[currentSessionKey][index].problems;
    // 問題をシャッフル（任意）
    // currentGameData.sort(() => Math.random() - 0.5); 
    startGame();
}

// --- ゲーム本体ロジック ---

/**
 * ゲーム開始
 */
function startGame() {
    // 1. 状態リセット
    score = 0;
    typedChars = 0;
    misses = 0;
    currentProblemIndex = -1; // nextProblem()で0になる

    // 2. 設定読み込み
    const settings = GAME_SETTINGS[currentMode];
    timerEl.textContent = settings.totalTime;
    scoreEl.textContent = score;

    // 3. 画面切り替え
    showScreen("game");

    // 4. タイマースタート
    let remainingTime = settings.totalTime;
    gameTimerId = setInterval(() => {
        remainingTime--;
        timerEl.textContent = remainingTime;
        if (remainingTime <= 0) {
            endGame();
        }
    }, 1000);

    // 5. 最初の問題を表示
    nextProblem();
}

/**
 * 次の問題を表示
 */
function nextProblem() {
    // 1. 前の問題のタイマーをクリア
    if (problemTimerId) {
        clearTimeout(problemTimerId);
        problemTimerId = null;
    }

    // 2. ボーナススコア加算 (ミスなしの場合)
    if (currentProblem && isProblemPerfect) {
        score += problemScore; // 1文字10ptなので、文字数 * 10
    }

    // 3. 次の問題へ
    currentProblemIndex++;
    if (currentProblemIndex >= currentGameData.length) {
        endGame(); // 全問終了
        return;
    }

    // 4. 問題データ取得
    currentProblem = currentGameData[currentProblemIndex];
    const targetText = currentProblem.en;
    
    // 5. 状態リセット
    currentTypedIndex = 0;
    isProblemPerfect = true;
    problemScore = targetText.replace(/ /g, '').length * 10; // スペースを除く文字数 * 10

    // 6. 画面表示更新
    scoreEl.textContent = score;
    jaTextEl.textContent = currentProblem.ja;

    if (currentMode === 'hard') {
        // ハードモード: 英語を非表示にし、spanを生成
        enTextEl.style.display = 'none';
        enTextHardContainer.style.display = 'flex';
        enTextHardContainer.innerHTML = ''; // クリア
        targetText.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char; // スペースは&nbsp;に
            enTextHardContainer.appendChild(span);
        });
    } else {
        // イージー/ノーマル: 英語を表示
        enTextEl.style.display = 'block';
        enTextHardContainer.style.display = 'none';
        enTextEl.textContent = targetText;
    }

    // 7. 入力ボックス処理
    inputBox.value = "";
    // 自動フォーカス (iPadでは動作が不安定な場合があるため、遅延実行)
    setTimeout(() => inputBox.focus(), 100);

    // 8. 問題ごとの制限時間タイマー
    const settings = GAME_SETTINGS[currentMode];
    problemTimerId = setTimeout(() => {
        isProblemPerfect = false; // 時間切れはミス扱い
        nextProblem();
    }, settings.problemTime * 1000);
}

/**
 * タイピング入力処理
 * @param {Event} e 
 */
function handleInput(e) {
    if (!currentProblem) return;

    const typedValue = inputBox.value;
    const targetText = currentProblem.en;

    // 1. 全体がターゲットの先頭部分と一致するかチェック
    if (targetText.startsWith(typedValue)) {
        // 2. 正しい入力
        const newCharsCount = typedValue.length - currentTypedIndex;
        if (newCharsCount > 0) { // 新しく正しい文字が入力された
            // スペースはポイント加算しない
            const newTypedChars = typedValue.substring(currentTypedIndex);
            const scoreToAdd = newTypedChars.replace(/ /g, '').length * 10;
            
            score += scoreToAdd;
            typedChars += newCharsCount; // タイプ文字数にはスペースも含む
            scoreEl.textContent = score;

            // ハードモード表示更新
            if (currentMode === 'hard') {
                const spans = enTextHardContainer.querySelectorAll('span');
                for (let i = currentTypedIndex; i < typedValue.length; i++) {
                    spans[i].classList.add('visible');
                }
            }
        }
        
        currentTypedIndex = typedValue.length; // インデックス更新

        // 3. 問題クリアチェック
        if (typedValue === targetText) {
            nextProblem();
        }

    } else {
        // 4. ミス
        misses++;
        isProblemPerfect = false;
        
        // 5. ミス地点（直前の正しい地点）まで入力を戻す
        //    (入力イベントの伝播を遅らせるため、setTimeoutでラップ)
        setTimeout(() => {
            inputBox.value = targetText.substring(0, currentTypedIndex);
        }, 0);
    }
}

/**
 * ゲーム終了処理
 * @param {boolean} [isForced=false] - ホームボタンによる強制終了か
 */
function endGame(isForced = false) {
    // 1. 全タイマー停止
    clearInterval(gameTimerId);
    clearTimeout(problemTimerId);
    gameTimerId = null;
    problemTimerId = null;

    if (isForced) {
        // 強制終了時はホームに戻るだけ
        showScreen("home");
        showHomeScreen("mode");
        return;
    }

    // 2. 進捗保存 (クリア判定)
    saveProgress();

    // 3. 結果画面表示
    const settings = GAME_SETTINGS[currentMode];
    resultTitleEl.textContent = `結果 (${settings.name} - Course ${currentCourseIndex + 1})`;
    finalScoreEl.textContent = score;
    totalTypedEl.textContent = typedChars;
    missCountEl.textContent = misses;

    if (score >= settings.clearScore) {
        resultMessageEl.textContent = "🎉 クリア！ 🎉";
        resultMessageEl.className = "clear";
    } else {
        resultMessageEl.textContent = "残念...もう一度挑戦しよう";
        resultMessageEl.className = "fail";
    }

    showScreen("result");
}