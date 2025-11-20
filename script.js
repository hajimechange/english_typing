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

// ゲーム設定（モードごとの得点・画像）
const GAME_SETTINGS = {
    easy:   { name: "イージー", scorePerChar: 5,  defaultMonster: "images/monster_easy.png" },
    normal: { name: "ノーマル", scorePerChar: 10, defaultMonster: "images/monster_normal.png" },
    hard:   { name: "ハード",   scorePerChar: 15, defaultMonster: "images/monster_hard.png" }
};

// 問題ごとの制限時間設定 (秒)
const TIME_SETTINGS = {
    // 単語コース (vocabularyData)
    vocab: { easy: 10, normal: 7, hard: 15 },
    // 文コース (quizData, grammarQuizData)
    sentence: { easy: 20, normal: 10, hard: 20 }
};

// ランクシステムの定義
const RANKS = [
    { name: "Lv.1 村人", threshold: 0 },
    { name: "Lv.2 旅人", threshold: 500 },
    { name: "Lv.3 見習い冒険者", threshold: 1500 },
    { name: "Lv.4 駆け出し戦士", threshold: 3000 },
    { name: "Lv.5 銅のタイピスト", threshold: 5000 },
    { name: "Lv.6 町の用心棒", threshold: 8000 },
    { name: "Lv.7 熟練の狩人", threshold: 12000 },
    { name: "Lv.8 銀のタイピスト", threshold: 17000 },
    { name: "Lv.9 歴戦の傭兵", threshold: 23000 },
    { name: "Lv.10 王国騎士", threshold: 30000 },
    { name: "Lv.11 近衛隊長", threshold: 38000 },
    { name: "Lv.12 金のタイピスト", threshold: 47000 },
    { name: "Lv.13 疾風の剣士", threshold: 57000 },
    { name: "Lv.14 雷鳴の魔導師", threshold: 68000 },
    { name: "Lv.15 ドラゴンキラー", threshold: 80000 },
    { name: "Lv.16 英雄候補生", threshold: 95000 },
    { name: "Lv.17 プラチナタイピスト", threshold: 115000 },
    { name: "Lv.18 国の救世主", threshold: 140000 },
    { name: "Lv.19 天空の覇者", threshold: 170000 },
    { name: "Lv.20 伝説の勇者", threshold: 200000 },
    { name: "Lv.21 光の守護者", threshold: 240000 },
    { name: "Lv.22 ダイヤタイピスト", threshold: 290000 },
    { name: "Lv.23 次元の超越者", threshold: 350000 },
    { name: "Lv.24 星の管理者", threshold: 420000 },
    { name: "Lv.25 時空の支配者", threshold: 500000 },
    { name: "Lv.26 言葉の魔神", threshold: 600000 },
    { name: "Lv.27 アルティメット", threshold: 720000 },
    { name: "Lv.28 キーボード・ゴッド", threshold: 850000 },
    { name: "Lv.29 創造神", threshold: 1000000 },
    { name: "Lv.30 THE TYPING MASTER", threshold: 1200000 }
];

// ゲーム状態変数
let currentMode = "easy";
let currentSessionKey = "quizData";
let currentCourseIndex = 0;
let currentGameData = [];     // 今回出題する問題リスト（シャッフル・抽出済み）
let currentProblem = null;
let currentProblemIndex = 0;
let currentTypedIndex = 0;

// モンスター・クリア判定用
let currentMonsterMaxHP = 1000;
let currentMonsterHP = 1000;
let currentClearScore = 1000; 

// タイマー関連
let problemTimerId = null;
let problemTimeRemaining = 0; // 現在の問題の残り時間（秒）

// スコア関連
let score = 0;
let typedChars = 0;
let misses = 0;
let isProblemPerfect = true; // 今の問題でミスがないか

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

// ホーム画面
const playerRankNameEl = document.getElementById("player-rank-name");
const totalExpEl = document.getElementById("total-exp");

// ゲーム画面
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer"); // ここに問題の残り時間を表示
const jaTextEl = document.getElementById("ja-text");
const enTextEl = document.getElementById("en-text");
const enTextHardContainer = document.getElementById("en-text-hard");
const inputBox = document.getElementById("input-box");

// モンスター
const monsterImgEl = document.getElementById("monster-img");
const hpBarFillEl = document.getElementById("hp-bar-fill");
const damageEffectEl = document.getElementById("damage-effect");

// 結果画面
const resultTitleEl = document.getElementById("result-title");
const resultMessageEl = document.getElementById("result-message");
const finalScoreEl = document.getElementById("final-score");
const totalTypedEl = document.getElementById("total-typed");
const missCountEl = document.getElementById("miss-count");

// --- サウンド ---
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
    // データの読み込みとコース分割
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
 * データをコースごとに分割し、モンスター画像を割り当てる
 */
function splitDataIntoCourses(data, key) {
    const categories = [...new Set(data.map(item => item.category))];
    
    courses[key] = categories.map((category, index) => {
        const problems = data.filter(item => item.category === category);
        
        // モンスター画像のフォルダ振り分け
        let folderName = null;
        if (key === 'vocabularyData') folderName = 'images2';
        else if (key === 'quizData') folderName = 'images3';
        else if (key === 'grammarQuizData') folderName = 'images4';

        let monsterImage = null;
        if (folderName) {
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
        
        if (typeof progress.totalXP === 'undefined') progress.totalXP = 0;
        if (!progress.vocabularyData) progress.vocabularyData = { easy: 0, normal: 0, hard: 0 };
    }
}

function saveProgress() {
    progress.totalXP += score;

    // クリア条件: モンスターを倒した（スコアが基準以上）
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
    const settings = GAME_SETTINGS[currentMode];

    courseTitle.textContent = `${settings.name} - コース選択`;
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
    // ここではコース全体を取得し、startGame内でシャッフルと抽出を行う
    startGame();
}

/**
 * 配列をシャッフルする関数
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// --- ゲーム本体ロジック ---

function startGame() {
    // 音声再生
    audioStart.currentTime = 0;
    audioStart.play().catch(e => {});
    audioBGM.currentTime = 0;
    audioBGM.play().catch(e => {});

    score = 0;
    typedChars = 0;
    misses = 0;
    currentProblemIndex = -1;

    const settings = GAME_SETTINGS[currentMode];
    
    // --- ★問題の選定（シャッフルして8割抽出） ---
    const originalProblems = courses[currentSessionKey][currentCourseIndex].problems;
    const shuffledProblems = shuffleArray(originalProblems);
    // 出題数は全問題数の80%（切り上げ、最低1問）
    const targetCount = Math.max(1, Math.ceil(shuffledProblems.length * 0.8));
    currentGameData = shuffledProblems.slice(0, targetCount);

    // --- ★クリア基準（モンスターHP）の計算 ---
    // 出題される問題の満点スコアを計算
    let totalPossibleScore = 0;
    currentGameData.forEach(p => {
        const charCount = p.en.replace(/ /g, '').length;
        // 満点 = (文字数 * 単価) + (ノーミスボーナス(文字数 * 単価)) = 文字数 * 単価 * 2
        totalPossibleScore += (charCount * settings.scorePerChar) * 2;
    });

    // 満点をHPにする（全問ノーミスで倒せる設定）
    currentClearScore = totalPossibleScore;
    
    // ただし、ボーナスなしでもギリギリ倒せるように少し調整しても良いが、
    // 今回は「全てタイプできればクリア」という要望に近い形で、
    // 「出題された問題をすべて、時間内に、ある程度正確に」打てば倒せるようにする。
    // 簡易的に「文字数 * 単価」の合計を基準とします（ボーナス込みだと難易度が跳ね上がるため）。
    
    // 再計算：ボーナス抜きの素点合計をHPとする
    totalPossibleScore = 0;
    currentGameData.forEach(p => {
        totalPossibleScore += p.en.replace(/ /g, '').length * settings.scorePerChar;
    });
    currentClearScore = totalPossibleScore;
    if (currentClearScore < 100) currentClearScore = 100;

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

    // 全体の制限時間は廃止
    timerEl.textContent = "--"; 

    nextProblem();
}

function nextProblem() {
    // 前の問題のタイマー停止
    if (problemTimerId) {
        clearInterval(problemTimerId);
        problemTimerId = null;
    }

    // 前の問題のスコア処理
    if (currentProblem && isProblemPerfect) {
        // ノーミスボーナス：問題の基本スコアと同じだけ加算（実質2倍）
        const bonus = currentProblem.en.replace(/ /g, '').length * GAME_SETTINGS[currentMode].scorePerChar;
        score += bonus;
        updateMonsterUI(bonus);
        triggerDamageEffect(bonus);
    }

    // クリア判定（スコアがHPを超えたら終了）
    if (score >= currentClearScore) {
        endGame();
        return;
    }

    currentProblemIndex++;
    
    // 全問終了チェック
    if (currentProblemIndex >= currentGameData.length) {
        // 全問終わってもスコアが足りない場合（時間切れ連発など）はここで終了
        endGame();
        return;
    }

    // 次の問題セット
    currentProblem = currentGameData[currentProblemIndex];
    const targetText = currentProblem.en;
    
    currentTypedIndex = 0;
    isProblemPerfect = true;

    scoreEl.textContent = score;
    jaTextEl.textContent = currentProblem.ja;

    // 画面表示切り替え
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

    // 発音読み上げ (vocabularyDataのみ)
    if (currentSessionKey === 'vocabularyData') {
        speakText(targetText);
    }

    // --- ★問題ごとのタイマー設定 ---
    let limitTime = 10; // デフォルト
    if (currentSessionKey === 'vocabularyData') {
        limitTime = TIME_SETTINGS.vocab[currentMode];
    } else {
        limitTime = TIME_SETTINGS.sentence[currentMode];
    }
    
    problemTimeRemaining = limitTime;
    timerEl.textContent = problemTimeRemaining; // 残り時間を表示

    // 1秒ごとに減算するタイマーを開始
    problemTimerId = setInterval(() => {
        problemTimeRemaining--;
        timerEl.textContent = problemTimeRemaining;

        if (problemTimeRemaining <= 0) {
            // 時間切れ
            clearInterval(problemTimerId);
            problemTimerId = null;
            isProblemPerfect = false; // 時間切れはミス扱い（ボーナスなし）
            // 強制的に次の問題へ
            nextProblem();
        }
    }, 1000);
}

function handleInput(e) {
    if (!currentProblem) return;

    const typedValue = inputBox.value;
    const targetText = currentProblem.en;

    if (targetText.startsWith(typedValue)) {
        // 正しい入力
        const newCharsCount = typedValue.length - currentTypedIndex;
        if (newCharsCount > 0) {
            audioType.currentTime = 0;
            audioType.play().catch(e => {});

            const newTypedChars = typedValue.substring(currentTypedIndex);
            // モードごとの単価でスコア計算
            const pointsPerChar = GAME_SETTINGS[currentMode].scorePerChar;
            const scoreToAdd = newTypedChars.replace(/ /g, '').length * pointsPerChar;
            
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
            
            // ★モンスターを倒したら即終了
            if (score >= currentClearScore) {
                endGame();
                return;
            }
        }
        
        currentTypedIndex = typedValue.length;

        // 問題クリア
        if (typedValue === targetText) {
            audioSuccess.currentTime = 0;
            audioSuccess.play().catch(e => {});
            nextProblem();
        }

    } else {
        // ミスタイプ
        audioIncorrect.currentTime = 0;
        audioIncorrect.play().catch(e => {});
        misses++;
        isProblemPerfect = false;
        
        // ★ペナルティ: 残り時間を2秒減らす
        problemTimeRemaining -= 2;
        if (problemTimeRemaining < 0) problemTimeRemaining = 0;
        timerEl.textContent = problemTimeRemaining; // 即座に表示更新
        
        // 入力を元に戻す
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

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; 
        window.speechSynthesis.speak(utterance);
    }
}

function endGame(isForced = false) {
    if (problemTimerId) clearInterval(problemTimerId);
    problemTimerId = null;

    audioBGM.pause();
    audioBGM.currentTime = 0;
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

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