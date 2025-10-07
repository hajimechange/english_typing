// 【重要】英単語リスト (ここを自由に編集して増やせます)
const wordList = [
    "apple", "banana", "cat", "dog", "elephant", 
    "friend", "garden", "happy", "island", "journey",
    "kind", "light", "mountain", "nature", "ocean",
    "peace", "quick", "river", "sunrise", "tree"
];

// DOM要素の取得
const wordDisplayElement = document.getElementById('word-display');
const typingInputElement = document.getElementById('typing-input');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');

// ゲームの状態
let currentWordIndex = 0;
let score = 0;
let isGameOver = false;

// ゲームの初期化と開始
function initGame() {
    // 単語リストをシャッフル
    wordList.sort(() => Math.random() - 0.5);
    
    currentWordIndex = 0;
    score = 0;
    isGameOver = false;
    scoreElement.textContent = score;
    messageElement.textContent = '';
    typingInputElement.value = '';
    typingInputElement.disabled = false;
    typingInputElement.focus(); // 入力フィールドにフォーカスを当てる

    displayWord();
}

// 現在の単語を表示する関数
function displayWord() {
    if (currentWordIndex < wordList.length) {
        // 次の単語を表示
        wordDisplayElement.textContent = wordList[currentWordIndex];
    } else {
        // 全ての単語を打ち終えたらゲームオーバー
        gameOver();
    }
}

// === 入力イベントの処理 ===
typingInputElement.addEventListener('input', () => {
    if (isGameOver) return;

    const currentWord = wordList[currentWordIndex];
    const typedText = typingInputElement.value;

    // 入力状況に応じて単語の色をリアルタイムで変更
    let highlightedWord = '';
    
    for (let i = 0; i < currentWord.length; i++) {
        let char = currentWord[i];
        
        if (i < typedText.length) {
            // 入力済みの文字の判定
            if (char === typedText[i]) {
                highlightedWord += `<span class="correct">${char}</span>`; // 正しい文字
            } else {
                highlightedWord += `<span class="incorrect">${char}</span>`; // 間違った文字
            }
        } else {
            // 未入力の文字
            highlightedWord += char;
        }
    }

    // 単語の表示を更新
    wordDisplayElement.innerHTML = highlightedWord;

    // 単語が完全に一致した場合の処理（次の単語へ）
    if (typedText === currentWord) {
        score++;
        scoreElement.textContent = score;
        messageElement.textContent = 'GOOD!';
        
        // 次の単語へ進む準備
        currentWordIndex++;
        typingInputElement.value = ''; 
        
        // わずかな時間（0.5秒）待ってから次の単語を表示
        setTimeout(() => {
            messageElement.textContent = '';
            displayWord();
        }, 500); 
    }
});

// ゲームオーバー処理
function gameOver() {
    isGameOver = true;
    typingInputElement.disabled = true;
    wordDisplayElement.textContent = 'ゲーム終了！';
    messageElement.textContent = `最終スコア: ${score} / ${wordList.length}単語を完了しました！`;
    
    // 1秒後にリプレイの確認ダイアログを表示
    setTimeout(() => {
        if(confirm(`ゲーム終了！スコア: ${score} / ${wordList.length}単語です。\nもう一度プレイしますか？`)) {
            initGame();
        }
    }, 1000);
}

// ゲーム開始
initGame();