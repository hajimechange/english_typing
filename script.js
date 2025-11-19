// 厳格モード
"use strict";

// --- グローバル変数・定数 ---
const courses = {
    quizData: [],
    grammarQuizData: [],
    vocabularyData: []
};

// 進捗データ
let progress = {
    totalXP: 0,
    quizData: { easy: 0, normal: 0, hard: 0 },
    grammarQuizData: { easy: 0, normal: 0, hard: 0 },
    vocabularyData: { easy: 0, normal: 0, hard: 0 }
};

const GAME_SETTINGS = {
    easy:   { totalTime: 60, problemTime: 20, clearScore: 1000, name: "イージー", defaultMonster: "images/monster_easy.png" },
    normal: { totalTime: 90, problemTime: 10, clearScore: 3000, name: "ノーマル", defaultMonster: "images/monster_normal.png" },
    hard:   { totalTime: 90, problemTime: 10, clearScore: 5000, name: "ハード",   defaultMonster: "images/monster_hard.png" }
};

// ★ランクシステムの定義（30段階に拡張）
const RANKS = [
    // --- 初級：見習い期間 (Lv.1 - Lv.5) ---
    { name: "Lv.1 村人", threshold: 0 },
    { name: "Lv.2 旅人", threshold: 500 },
    { name: "Lv.3 見習い冒険者", threshold: 1500 },
    { name: "Lv.4 駆け出し戦士", threshold: 3000 },
    { name: "Lv.5 銅のタイピスト", threshold: 5000 },

    // --- 中級：成長期 (Lv.6 - Lv.10) ---
    { name: "Lv.6 町の用心棒", threshold: 8000 },
    { name: "Lv.7 熟練の狩人", threshold: 12000 },
    { name: "Lv.8 銀のタイピスト", threshold: 17000 },
    { name: "Lv.9 歴戦の傭兵", threshold: 23000 },
    { name: "Lv.10 王国騎士", threshold: 30000 },

    // --- 上級：熟練期 (Lv.11 - Lv.15) ---
    { name: "Lv.11 近衛隊長", threshold: 38000 },
    { name: "Lv.12 金のタイピスト", threshold: 47000 },
    { name: "Lv.13 疾風の剣士", threshold: 57000 },
    { name: "Lv.14 雷鳴の魔導師", threshold: 68000 },
    { name: "Lv.15 ドラゴンキラー", threshold: 80000 },

    // --- 超級：英雄期 (Lv.16 - Lv.20) ---
    { name: "Lv.16 英雄候補生", threshold: 95000 },
    { name: "Lv.17 プラチナタイピスト", threshold: 115000 },
    { name: "Lv.18 国の救世主", threshold: 140000 },
    { name: "Lv.19 天空の覇者", threshold: 170000 },
    { name: "Lv.20 伝説の勇者", threshold: 200000 },

    // --- 神級：伝説期 (Lv.21 - Lv.25) ---
    { name: "Lv.21 光の守護者", threshold: 240000 },
    { name: "Lv.22 ダイヤタイピスト", threshold: 290000 },
    { name: "Lv.23 次元の超越者", threshold: 350000 },
    { name: "Lv.24 星の管理者", threshold: 420000 },
    { name: "Lv.25 時空の支配者", threshold: 500000 },

    // --- 究極：神話期 (Lv.26 - Lv.30) ---
    { name: "Lv.26 言葉の魔神", threshold: 600000 },
    { name: "Lv.27 アルティメット", threshold: 720000 },
    { name: "Lv.28 キーボード・ゴッド", threshold: 850000 },
    { name: "Lv.29 創造神", threshold: 1000000 },
    { name: "Lv.30 THE TYPING MASTER", threshold: 1200000 }
];

// ゲーム状態
let currentMode = "easy";
let currentSessionKey = "quizData";
let currentCourseIndex = 0;
let currentGameData = [];
let currentProblem = null;
let currentProblemIndex = 0;
let currentTypedIndex = 0;

// モンスター・クリア判定用状態変数
let currentMonsterMaxHP = 1000;
let currentMonsterHP = 1000;
let currentClearScore = 1000; 

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

// ホーム画面ランク用要素
const playerRankNameEl = document.getElementById("player-rank-name");
const totalExpEl = document.getElementById("total-exp");

// ゲーム画面要素
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const jaTextEl = document.getElementById("ja-text");
const enTextEl = document.getElementById("en-text");
const enTextHardContainer = document.getElementById("en-text-hard");
const inputBox = document.getElementById("input-box");

// モンスター用要素
const monsterImgEl = document.getElementById("monster-img");
const hpBarFillEl = document.getElementById("hp-bar-fill");
const damageEffectEl = document.getElementById("damage-effect");

// 結果画面要素
const resultTitleEl = document.getElementById("result-title");
const resultMessageEl = document.getElementById("result-message");
const finalScoreEl = document.getElementById("final-score");
const totalTypedEl = document.getElementById("total-typed");
const missCountEl = document.getElementById("miss-count");

// --- サウンド関連 ---
const audioStart = new Audio('sounds/start.mp3');
const audioType = new Audio('sounds/type1.mp3');
const audioIncorrect = new Audio('sounds/incorrect.mp3');
const audioSuccess = new Audio('sounds/success.mp3');
const audioFinish = new Audio('sounds/finish.mp3');
const audioBGM = new Audio('sounds/battle.mp3');
audioBGM.loop = true;
audioBGM.volume = 0.3;


// --- 初期化処理 ---
document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
    if (typeof allQuizData !== 'undefined') splitDataIntoCourses(allQuizData, 'quizData');
    if (typeof grammarQuizData !== 'undefined') splitDataIntoCourses(grammarQuizData, 'grammarQuizData');
    
    if (typeof vocabularyData !== 'undefined') {
        splitDataIntoCourses(vocabularyData, 'vocabularyData');
    } else {
        console.warn("vocabularyData.js が読み込まれていません。");
    }

    loadProgress();
    updateRankDisplay();
    setupEventListeners();
    showHomeScreen("mode");
}

/**
 * データをコースごとに分割し、セッションに応じたモンスター画像を割り当てる
 */
function splitDataIntoCourses(data, key) {
    const categories = [...new Set(data.map(item => item.category))];
    
    courses[key] = categories.map((category, index) => {
        const problems = data.filter(item => item.category === category);
        
        // ★モンスター画像のフォルダ振り分け
        let folderName = null;
        if (key === 'vocabularyData') {
            folderName = 'images2';
        } else if (key === 'quizData') {
            folderName = 'images4';
        } else if (key === 'grammarQuizData') {
            folderName = 'images3';
        }

        let monsterImage = null;
        if (folderName) {
            // 1.jpg, 2.jpg ... のように連番で割り当て
            const imageIndex = index + 1; 
            monsterImage = `${folderName}/${imageIndex}.jpg`;
        }

        return { 
            name: category, 
            problems: problems,
            monsterImg: monsterImage 
        };
    });
}

function loadProgress() {
    const savedProgress = localStorage.getItem("typingGameProgress");
    if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        progress = { ...progress, ...parsed };
        
        if (typeof progress.totalXP === 'undefined') {
            progress.totalXP = 0;
        }
        if (!progress.vocabularyData) {
            progress.vocabularyData = { easy: 0, normal: 0, hard: 0 };
        }
    }
}

function saveProgress() {
    progress.totalXP += score;

    // currentClearScore以上ならクリアとして記録
    if (score >= currentClearScore) {
        const clearedIndex = currentCourseIndex;
        const maxCleared = progress[currentSessionKey][currentMode];
        if (clearedIndex + 1 > maxCleared) {
            progress[currentSessionKey][currentMode] = clearedIndex + 1;
        }
    }
    localStorage.setItem("typingGameProgress", JSON.stringify(progress));
    
    updateRankDisplay();
}

function updateRankDisplay() {
    let currentRankName = RANKS[0].name;
    
    for (let i = 0; i < RANKS.length; i++) {
        if (progress.totalXP >= RANKS[i].threshold) {
            currentRankName = RANKS[i].name;
        } else {
            break;
        }
    }

    playerRankNameEl.textContent = currentRankName;
    totalExpEl.textContent = progress.totalXP;
}

// --- イベントリスナー設定 ---
function setupEventListeners() {
    document.querySelectorAll(".btn-mode").forEach(btn => {
        btn.addEventListener("click", () => selectMode(btn.dataset.mode));
    });
    document.querySelectorAll(".btn-session").forEach(btn => {
        btn.addEventListener("click", () => selectSession(btn.dataset.session));
    });
    document.querySelectorAll(".btn-back").forEach(btn => {
        btn.addEventListener("click", () => showHomeScreen(btn.dataset.target));
    });
    document.getElementById("home-btn").addEventListener("click", () => {
        if (confirm("ゲームを中断してホームに戻りますか？")) {
            endGame(true);
        }
    });
    document.getElementById("back-to-home-btn").addEventListener("click", () => {
        showScreen("home");
        showHomeScreen("mode");
    });
    inputBox.addEventListener("input", handleInput);
}

// --- 画面遷移ロジック ---
function showScreen(screenId) {
    Object.values(screens).forEach(screen => screen.classList.remove("active"));
    screens[screenId].classList.add("active");
}

function showHomeScreen(view) {
    Object.values(selectionContainers).forEach(container => container.style.display = "none");
    if (view === "mode") selectionContainers.mode.style.display = "flex";
    else if (view === "session") selectionContainers.session.style.display = "flex";
    else if (view === "course") {
        selectionContainers.course.style.display = "flex";
        updateCourseDisplay();
    }
    showScreen("home");
}

function selectMode(mode) {
    currentMode = mode;
    showHomeScreen("session");
}

function selectSession(sessionKey) {
    currentSessionKey = sessionKey;
    showHomeScreen("course");
}

function updateCourseDisplay() {
    const courseGrid = document.getElementById("course-grid");
    const courseTitle = document.getElementById("course-title");
    const sessionCourses = courses[currentSessionKey];
    const maxCleared = progress[currentSessionKey][currentMode];

    courseTitle.textContent = `${GAME_SETTINGS[currentMode].name} - コース選択`;
    courseGrid.innerHTML = "";

    if (!sessionCourses || sessionCourses.length === 0) {
        courseGrid.innerHTML = "<p>コースデータがありません。</p>";
        return;
    }

    sessionCourses.forEach((course, index) => {
        const btn = document.createElement("button");
        btn.classList.add("btn", "course-btn");
        btn.textContent = `Course ${index + 1}: ${course.name}`;
        
        if (index <= maxCleared) {
            btn.dataset.index = index;
            btn.addEventListener("click", () => selectCourse(index));
        } else {
            btn.classList.add("locked");
            btn.disabled = true;
        }
        courseGrid.appendChild(btn);
    });
}

function selectCourse(index) {
    currentCourseIndex = index;
    currentGameData = courses[currentSessionKey][index].problems;
    startGame();
}

// --- ゲーム本体ロジック ---

function startGame() {
    audioStart.currentTime = 0;
    audioStart.play().catch(e => console.error("Audio play failed:", e));

    audioBGM.currentTime = 0;
    audioBGM.play().catch(e => console.error("BGM play failed:", e));

    score = 0;
    typedChars = 0;
    misses = 0;
    currentProblemIndex = -1;

    const settings = GAME_SETTINGS[currentMode];
    timerEl.textContent = settings.totalTime;
    scoreEl.textContent = score;

    // --- ★クリア基準（モンスターHP）の計算 ---
    // すべてのセッションで「収録問題の合計スコアの8割」を基準とする
    let totalCoursePossibleScore = 0;
    currentGameData.forEach(p => {
        // 1文字10点換算
        totalCoursePossibleScore += p.en.replace(/ /g, '').length * 10;
    });

    // 8割をクリア基準とする
    currentClearScore = Math.floor(totalCoursePossibleScore * 0.8);
    
    // 最低でも100点（10文字分）は必要とする安全策
    if (currentClearScore < 100) currentClearScore = 100;

    // モンスターHPをクリア基準と同期
    currentMonsterMaxHP = currentClearScore;
    currentMonsterHP = currentMonsterMaxHP;

    // --- モンスター画像の設定 ---
    const currentCourse = courses[currentSessionKey][currentCourseIndex];
    if (currentCourse.monsterImg) {
        monsterImgEl.src = currentCourse.monsterImg;
    } else {
        monsterImgEl.src = settings.defaultMonster;
    }
    
    monsterImgEl.classList.remove("defeated");
    updateMonsterUI();

    showScreen("game");

    let remainingTime = settings.totalTime;
    gameTimerId = setInterval(() => {
        remainingTime--;
        timerEl.textContent = remainingTime;
        if (remainingTime <= 0) {
            endGame(); // タイムアップ終了
        }
    }, 1000);

    nextProblem();
}

function nextProblem() {
    if (problemTimerId) {
        clearTimeout(problemTimerId);
        problemTimerId = null;
    }

    if (currentProblem && isProblemPerfect) {
        score += problemScore;
        updateMonsterUI(problemScore);
        triggerDamageEffect(problemScore);
    }

    // ★修正: ボーナス加算等でスコアが増え、モンスターを倒していたら即終了
    if (score >= currentClearScore) {
        endGame();
        return;
    }

    currentProblemIndex++;
    // 全問終了しても、まだスコアが足りない場合は終了（失敗扱いになる）
    if (currentProblemIndex >= currentGameData.length) {
        endGame();
        return;
    }

    currentProblem = currentGameData[currentProblemIndex];
    const targetText = currentProblem.en;
    
    currentTypedIndex = 0;
    isProblemPerfect = true;
    problemScore = targetText.replace(/ /g, '').length * 10;

    scoreEl.textContent = score;
    jaTextEl.textContent = currentProblem.ja;

    if (currentMode === 'hard') {
        enTextEl.style.display = 'none';
        enTextHardContainer.style.display = 'flex';
        enTextHardContainer.innerHTML = '';
        targetText.split('').forEach(char => {
            const span = document.createElement('span');
            span.dataset.char = char;
            span.textContent = (char === ' ') ? '\u00A0' : '_';
            enTextHardContainer.appendChild(span);
        });
    } else {
        enTextEl.style.display = 'block';
        enTextHardContainer.style.display = 'none';
        enTextEl.textContent = targetText;
    }

    inputBox.value = "";
    setTimeout(() => inputBox.focus(), 100);

    const settings = GAME_SETTINGS[currentMode];
    problemTimerId = setTimeout(() => {
        isProblemPerfect = false;
        nextProblem();
    }, settings.problemTime * 1000);
}

function handleInput(e) {
    // ゲーム終了後は入力を受け付けない
    if (!currentProblem || !gameTimerId) return;

    const typedValue = inputBox.value;
    const targetText = currentProblem.en;

    if (targetText.startsWith(typedValue)) {
        const newCharsCount = typedValue.length - currentTypedIndex;
        if (newCharsCount > 0) {
            audioType.currentTime = 0;
            audioType.play().catch(e => {});

            const newTypedChars = typedValue.substring(currentTypedIndex);
            const scoreToAdd = newTypedChars.replace(/ /g, '').length * 10;
            
            score += scoreToAdd;
            typedChars += newCharsCount;
            scoreEl.textContent = score;

            updateMonsterUI(scoreToAdd);
            if (scoreToAdd > 0) triggerMonsterShake();

            if (currentMode === 'hard') {
                const spans = enTextHardContainer.querySelectorAll('span');
                const rootStyles = getComputedStyle(document.documentElement);
                const defaultColor = rootStyles.getPropertyValue('--text-color').trim();
                for (let i = currentTypedIndex; i < typedValue.length; i++) {
                    const char = spans[i].dataset.char; 
                    spans[i].textContent = char;
                    spans[i].style.color = defaultColor;
                }
            }

            // ★追加: モンスターを倒したら（クリアスコアに達したら）即終了
            if (score >= currentClearScore) {
                endGame();
                return;
            }
        }
        
        currentTypedIndex = typedValue.length;

        if (typedValue === targetText) {
            audioSuccess.currentTime = 0;
            audioSuccess.play().catch(e => {});
            nextProblem();
        }

    } else {
        audioIncorrect.currentTime = 0;
        audioIncorrect.play().catch(e => {});
        misses++;
        isProblemPerfect = false;
        setTimeout(() => {
            inputBox.value = targetText.substring(0, currentTypedIndex);
        }, 0);
    }
}

function updateMonsterUI(damage = 0) {
    const currentHP = Math.max(0, currentMonsterMaxHP - score);
    const hpPercent = (currentHP / currentMonsterMaxHP) * 100;
    
    hpBarFillEl.style.width = `${hpPercent}%`;
    
    if (hpPercent > 50) hpBarFillEl.style.backgroundColor = "#28a745";
    else if (hpPercent > 20) hpBarFillEl.style.backgroundColor = "#ffc107";
    else hpBarFillEl.style.backgroundColor = "#dc3545";

    if (currentHP <= 0) {
        monsterImgEl.classList.add("defeated");
    }
}

function triggerMonsterShake() {
    monsterImgEl.classList.remove("shake");
    void monsterImgEl.offsetWidth;
    monsterImgEl.classList.add("shake");
}

function triggerDamageEffect(damage) {
    if (damage <= 0) return;
    damageEffectEl.textContent = `-${damage}`;
    damageEffectEl.classList.remove("damage-pop");
    void damageEffectEl.offsetWidth;
    damageEffectEl.classList.add("damage-pop");
}

function endGame(isForced = false) {
    // 二重呼び出し防止（タイマーと入力イベントが競合した場合など）
    if (gameTimerId === null && problemTimerId === null && !isForced) return;

    clearInterval(gameTimerId);
    clearTimeout(problemTimerId);
    gameTimerId = null;
    problemTimerId = null;

    audioBGM.pause();
    audioBGM.currentTime = 0;

    if (isForced) {
        showScreen("home");
        showHomeScreen("mode");
        return;
    }

    audioFinish.currentTime = 0;
    audioFinish.play().catch(e => {});

    saveProgress();

    const settings = GAME_SETTINGS[currentMode];
    resultTitleEl.textContent = `結果 (${settings.name} - Course ${currentCourseIndex + 1})`;
    finalScoreEl.textContent = score;
    totalTypedEl.textContent = typedChars;
    missCountEl.textContent = misses;

    if (score >= currentClearScore) {
        resultMessageEl.textContent = "🎉 クリア！ Monster Defeated! 🎉";
        resultMessageEl.className = "clear";
    } else {
        resultMessageEl.textContent = "残念... モンスターは逃げてしまった";
        resultMessageEl.className = "fail";
    }

    showScreen("result");
}