// ==========================================
// 幼兒園生活常識拖曳測驗系統 (p5.js)
// 全螢幕響應式 (RWD) & 繁體中文詳細註解
// ==========================================

// ------------------------------------------
// 1. 全局變數宣告
// ------------------------------------------

// 題目資料庫 (包含 6 個幼兒園生活常識主題)
let quizData = [
  { id: 1, text: "飯前要洗手", category: "handwash", hint: "洗手清潔" },
  { id: 2, text: "看書要保持距離", category: "reading", hint: "保護眼睛" },
  { id: 3, text: "過馬路看紅綠燈", category: "traffic", hint: "交通安全" },
  { id: 4, text: "垃圾投進垃圾桶", category: "trash", hint: "環境整潔" },
  { id: 5, text: "睡前要刷牙", category: "teeth", hint: "牙齒健康" },
  { id: 6, text: "睡覺要準時", category: "sleep", hint: "規律作息" }
];

// 存放上方目標放置區與下方可拖曳卡片的陣列
let targetZones = [];
let draggableCards = [];

// 當前被拖曳的卡片物件索引 (若無則為 -1)
let draggedCardIndex = -1;
let touchOffsetX = 0;
let touchOffsetY = 0;

// 遊戲狀態： 'PLAYING' (答題中), 'SUBMITTED' (已交卷), 'TIME_UP' (時間到)
let gameState = 'PLAYING';

// 按鈕物件 (位置與大小在 repositionElements 計算)
let submitBtn = { x: 0, y: 0, w: 220, h: 50, visible: false };
let restartBtn = { x: 0, y: 0, w: 190, h: 44, visible: false };
let topRestartBtn = { x: 0, y: 0, w: 110, h: 36, visible: true }; // 頂端隨時重新開始按鈕

// 計時器變數
let totalTimeLimit = 60; // 倒數計時總秒數 (60秒)
let startTime = 0;       // 遊戲開始毫秒數
let elapsedTime = 0;     // 已使用秒數
let remainingTime = 60;  // 剩餘秒數
let timeSpent = 0;       // 完成遊戲所花費秒數

// 成績變數
let score = 0;
let correctCount = 0;

// 禮花彩帶粒子陣列
let confettiParticles = [];

// ------------------------------------------
// 2. p5.js 初始化設定 (setup)
// ------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  initGame();
}

// ------------------------------------------
// 3. 視窗大小改變時的響應式調整 (windowResized)
// ------------------------------------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  repositionElements();
}

// ------------------------------------------
// 4. 初始化/重置遊戲資料 (initGame)
// ------------------------------------------
function initGame() {
  gameState = 'PLAYING';
  draggedCardIndex = -1;
  confettiParticles = [];
  submitBtn.visible = false;
  restartBtn.visible = false;

  // 重置計時器時間點
  startTime = millis();
  elapsedTime = 0;
  remainingTime = totalTimeLimit;
  timeSpent = 0;

  targetZones = [];
  draggableCards = [];

  // 打亂題目順序
  let shuffledTargets = shuffle([...quizData]);
  let shuffledCards = shuffle([...quizData]);

  // 建立 6 個目標區
  for (let i = 0; i < shuffledTargets.length; i++) {
    targetZones.push({
      id: shuffledTargets[i].id,
      category: shuffledTargets[i].category,
      hint: shuffledTargets[i].hint,
      correctText: shuffledTargets[i].text,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      occupiedByCardId: null
    });
  }

  // 建立 6 個可拖曳卡片
  for (let i = 0; i < shuffledCards.length; i++) {
    draggableCards.push({
      id: shuffledCards[i].id,
      text: shuffledCards[i].text,
      x: 0,
      y: 0,
      homeX: 0,
      homeY: 0,
      w: 0,
      h: 0,
      isDragging: false,
      targetZoneId: null
    });
  }

  repositionElements();
}

// ------------------------------------------
// 5. 響應式佈局計算 (repositionElements)
// ------------------------------------------
function repositionElements() {
  let cols = windowWidth > 768 ? 3 : 2;
  let rows = ceil(6 / cols);

  let headerH = height * 0.14;
  let zoneAreaH = height * 0.46;

  let zoneW = min((width - (cols + 1) * 20) / cols, 220);
  let zoneH = min((zoneAreaH - (rows + 1) * 15) / rows, 130);

  // 計算目標區座標
  for (let i = 0; i < targetZones.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let totalGridW = cols * zoneW + (cols - 1) * 20;
    let startX = (width - totalGridW) / 2 + zoneW / 2;
    let startY = headerH + row * (zoneH + 15) + zoneH / 2;

    targetZones[i].x = startX + col * (zoneW + 20);
    targetZones[i].y = startY;
    targetZones[i].w = zoneW;
    targetZones[i].h = zoneH;
  }

  // 計算拖曳卡片座標
  let cardW = zoneW;
  let cardH = min(zoneH * 0.55, 52);

  for (let i = 0; i < draggableCards.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let totalGridW = cols * cardW + (cols - 1) * 20;
    let startX = (width - totalGridW) / 2 + cardW / 2;
    let startY = headerH + zoneAreaH + row * (cardH + 12) + cardH / 2 + 10;

    let card = draggableCards[i];
    card.w = cardW;
    card.h = cardH;
    card.homeX = startX + col * (cardW + 20);
    card.homeY = startY;

    if (card.targetZoneId === null && !card.isDragging) {
      card.x = card.homeX;
      card.y = card.homeY;
    } else if (card.targetZoneId !== null) {
      let tz = targetZones.find(z => z.id === card.targetZoneId);
      if (tz) {
        card.x = tz.x;
        card.y = tz.y + tz.h * 0.28;
      }
    }
  }

  // 交卷按鈕位置
  submitBtn.x = width / 2;
  submitBtn.y = height - 45;
  submitBtn.w = min(220, width * 0.6);
  submitBtn.h = 46;

  // 頂端重來按鈕
  topRestartBtn.w = min(110, width * 0.25);
  topRestartBtn.h = 36;
  topRestartBtn.x = width - topRestartBtn.w / 2 - 15;
  topRestartBtn.y = 28;
}

// ------------------------------------------
// 6. 主繪製循環 (draw)
// ------------------------------------------
function draw() {
  drawBackground();
  updateTimer();
  drawHeader();

  if (gameState === 'PLAYING') {
    drawTargetZones();
    drawDraggableCards();

    // 檢查是否所有卡片都已放好
    checkAllPlaced();

    if (submitBtn.visible) {
      drawSubmitButton();
    }
  } else if (gameState === 'SUBMITTED' || gameState === 'TIME_UP') {
    // 先繪製下方遊戲底圖作為背景襯托
    drawTargetZones();
    drawDraggableCards();

    // 繪製最上層成績面板
    drawScoreScreen();

    if (score > 80 && gameState === 'SUBMITTED') {
      updateAndDrawConfetti();
    }
  }
}

// ------------------------------------------
// 7. 計時器更新邏輯
// ------------------------------------------
function updateTimer() {
  if (gameState === 'PLAYING') {
    elapsedTime = floor((millis() - startTime) / 1000);
    remainingTime = max(0, totalTimeLimit - elapsedTime);

    if (remainingTime <= 0) {
      gameState = 'TIME_UP';
      calculateScore();
    }
  }
}

// ------------------------------------------
// 8. 背景與標題繪製
// ------------------------------------------
function drawBackground() {
  background(255, 249, 230);
  noStroke();
  fill(255, 220, 180, 80);
  for (let x = 30; x < width; x += 80) {
    for (let y = 30; y < height; y += 80) {
      circle(x, y, 12);
    }
  }
}

function drawHeader() {
  push();
  rectMode(CENTER);

  // 標題
  fill(255, 120, 150);
  noStroke();
  let titleW = min(width * 0.45, 280);
  rect(width / 2, 28, titleW, 38, 20);

  fill(255);
  textSize(min(18, width * 0.04));
  textStyle(BOLD);
  text("🎈 生活常識對對碰", width / 2, 28);

  // 左側計時器
  let timerX = max(70, width * 0.15);
  fill(remainingTime <= 10 ? color(255, 90, 90) : color(100, 190, 240));
  rect(timerX, 28, 110, 36, 18);

  fill(255);
  textSize(15);
  textStyle(BOLD);
  text(`⏱️ ${remainingTime} 秒`, timerX, 28);

  // 右側頂端「重來」按鈕
  let isHoverTopBtn = isInsideBtn(mouseX, mouseY, topRestartBtn);
  fill(isHoverTopBtn ? color(255, 160, 60) : color(255, 180, 80));
  stroke(255);
  strokeWeight(2);
  rect(topRestartBtn.x, topRestartBtn.y, topRestartBtn.w, topRestartBtn.h, 18);

  fill(255);
  noStroke();
  textSize(13);
  textStyle(BOLD);
  text("🔄 重來", topRestartBtn.x, topRestartBtn.y);

  if (gameState === 'PLAYING') {
    fill(100, 80, 60);
    textSize(min(13, width * 0.033));
    textStyle(NORMAL);
    text("請將下方的文字卡片，拖曳放到對應的可愛圖片下方喔！", width / 2, height * 0.09);
  }
  pop();
}

// ------------------------------------------
// 9. 繪製上方 6 個目標區
// ------------------------------------------
function drawTargetZones() {
  for (let zone of targetZones) {
    push();
    rectMode(CENTER);

    let isFilled = zone.occupiedByCardId !== null;

    stroke(120, 180, 250);
    strokeWeight(2);
    fill(isFilled ? color(235, 245, 255) : color(255, 255, 255, 220));
    rect(zone.x, zone.y, zone.w, zone.h, 15);

    drawAnimatedIcon(zone.category, zone.x, zone.y - zone.h * 0.18, zone.w, zone.h);

    if (!isFilled) {
      noStroke();
      fill(160, 170, 190);
      textSize(min(12, zone.w * 0.11));
      textStyle(BOLD);
      text("〔 放在這裡 〕", zone.x, zone.y + zone.h * 0.28);
    }

    pop();
  }
}

// ------------------------------------------
// 10. 動態 GIF 圖案繪製
// ------------------------------------------
function drawAnimatedIcon(category, x, y, w, h) {
  push();
  translate(x, y);
  let t = frameCount * 0.05;

  if (category === "handwash") {
    fill(255, 210, 180);
    noStroke();
    ellipse(0, 5, 28, 22);
    circle(-8, -4, 6); circle(-3, -7, 6); circle(3, -7, 6); circle(8, -4, 6);
    fill(150, 220, 255, 180);
    circle(sin(t) * 12 - 5, -12 + cos(t) * 3, 10 + sin(t) * 2);
    circle(cos(t * 1.5) * 12 + 8, -15 + sin(t) * 3, 12);
  } else if (category === "reading") {
    fill(255, 130, 130);
    rectMode(CENTER);
    rect(-10, 2, 18, 22, 3);
    fill(230, 100, 100);
    rect(10, 2, 18, 22, 3);
    fill(255);
    rect(-9, 2, 15, 20, 2);
    rect(9, 2, 15, 20, 2);
    stroke(80);
    strokeWeight(2);
    if (sin(t * 2) > -0.8) {
      fill(80);
      circle(-5, -15, 3); circle(5, -15, 3);
    } else {
      line(-7, -15, -3, -15); line(3, -15, 7, -15);
    }
  } else if (category === "traffic") {
    fill(60);
    noStroke();
    rectMode(CENTER);
    rect(0, 0, 22, 36, 5);
    let activeLight = floor((frameCount / 30) % 3);
    fill(activeLight === 0 ? color(255, 60, 60) : color(100, 30, 30)); circle(0, -9, 8);
    fill(activeLight === 1 ? color(255, 220, 50) : color(100, 90, 20)); circle(0, 0, 8);
    fill(activeLight === 2 ? color(50, 230, 100) : color(20, 90, 40)); circle(0, 9, 8);
  } else if (category === "trash") {
    fill(100, 200, 140);
    noStroke();
    quad(-11, -8, 11, -8, 8, 15, -8, 15);
    push();
    translate(0, -9);
    rotate(sin(t * 2) * 0.15);
    fill(70, 160, 110);
    rectMode(CENTER);
    rect(0, 0, 26, 5, 2); rect(0, -3, 8, 3, 1);
    pop();
  } else if (category === "teeth") {
    fill(255); stroke(220); strokeWeight(1);
    rectMode(CENTER); rect(0, 3, 20, 20, 6);
    push();
    translate(sin(t * 4) * 8, -5);
    fill(255, 100, 150); noStroke();
    rect(0, 0, 22, 4, 2);
    fill(255); rect(-6, 3, 8, 4, 1);
    pop();
  } else if (category === "sleep") {
    fill(255, 210, 60); noStroke();
    circle(0, 2, 26);
    fill(255, 249, 230); circle(7, -2, 22);
    fill(140, 120, 210);
    textSize(10 + sin(t * 2) * 2); textStyle(BOLD);
    text("z", 10 + cos(t) * 2, -10 - (frameCount % 40) * 0.3);
  }

  pop();
}

// ------------------------------------------
// 11. 繪製拖曳卡片
// ------------------------------------------
function drawDraggableCards() {
  for (let i = 0; i < draggableCards.length; i++) {
    if (i !== draggedCardIndex) {
      drawSingleCard(draggableCards[i]);
    }
  }
  if (draggedCardIndex !== -1) {
    drawSingleCard(draggableCards[draggedCardIndex]);
  }
}

function drawSingleCard(card) {
  push();
  rectMode(CENTER);

  if (card.isDragging) {
    fill(0, 0, 0, 30);
    rect(card.x + 4, card.y + 6, card.w, card.h, 12);
  }

  stroke(255, 150, 50);
  strokeWeight(card.isDragging ? 3 : 2);

  if (card.isDragging) {
    fill(255, 235, 200);
  } else if (card.targetZoneId !== null) {
    fill(230, 245, 230);
    stroke(80, 180, 100);
  } else {
    fill(255, 255, 255);
  }

  rect(card.x, card.y, card.w, card.h, 12);

  noStroke();
  fill(50, 50, 80);
  textSize(min(14, card.w * 0.11));
  textStyle(BOLD);
  text(card.text, card.x, card.y);

  pop();
}

// ------------------------------------------
// 12. 滑鼠與觸控事件 (點擊判定修復)
// ------------------------------------------
function mousePressed() {
  handleInputStart(mouseX, mouseY);
}

function touchStarted() {
  if (touches.length > 0) {
    handleInputStart(touches[0].x, touches[0].y);
  }
  return false;
}

function handleInputStart(inputX, inputY) {
  // 1. 頂端「重來」按鈕 (任何狀態皆可觸發)
  if (isInsideBtn(inputX, inputY, topRestartBtn)) {
    initGame();
    return;
  }

  // 2. 結算畫面點擊「再玩一次」按鈕
  if (gameState === 'SUBMITTED' || gameState === 'TIME_UP') {
    if (restartBtn.visible && isInsideBtn(inputX, inputY, restartBtn)) {
      initGame();
    }
    return; // 結算狀態下阻擋卡片拖曳
  }

  // 3. 點擊「交卷看成績」按鈕
  if (gameState === 'PLAYING' && submitBtn.visible && isInsideBtn(inputX, inputY, submitBtn)) {
    calculateScore();
    return;
  }

  // 4. 卡片拖曳判定
  if (gameState === 'PLAYING') {
    for (let i = draggableCards.length - 1; i >= 0; i--) {
      let card = draggableCards[i];
      if (
        inputX > card.x - card.w / 2 &&
        inputX < card.x + card.w / 2 &&
        inputY > card.y - card.h / 2 &&
        inputY < card.y + card.h / 2
      ) {
        draggedCardIndex = i;
        card.isDragging = true;
        touchOffsetX = card.x - inputX;
        touchOffsetY = card.y - inputY;

        if (card.targetZoneId !== null) {
          let tz = targetZones.find(z => z.id === card.targetZoneId);
          if (tz) tz.occupiedByCardId = null;
          card.targetZoneId = null;
        }
        break;
      }
    }
  }
}

function mouseDragged() {
  handleInputMove(mouseX, mouseY);
}

function touchMoved() {
  if (touches.length > 0) {
    handleInputMove(touches[0].x, touches[0].y);
  }
  return false;
}

function handleInputMove(inputX, inputY) {
  if (draggedCardIndex !== -1 && gameState === 'PLAYING') {
    let card = draggableCards[draggedCardIndex];
    card.x = inputX + touchOffsetX;
    card.y = inputY + touchOffsetY;
  }
}

function mouseReleased() {
  handleInputEnd();
}

function touchEnded() {
  handleInputEnd();
}

function handleInputEnd() {
  if (draggedCardIndex !== -1 && gameState === 'PLAYING') {
    let card = draggableCards[draggedCardIndex];
    card.isDragging = false;

    let droppedInZone = false;
    for (let zone of targetZones) {
      let d = dist(card.x, card.y, zone.x, zone.y);
      if (d < zone.w * 0.6) {
        if (zone.occupiedByCardId !== null) {
          let oldCard = draggableCards.find(c => c.id === zone.occupiedByCardId);
          if (oldCard) {
            oldCard.targetZoneId = null;
            oldCard.x = oldCard.homeX;
            oldCard.y = oldCard.homeY;
          }
        }

        card.targetZoneId = zone.id;
        zone.occupiedByCardId = card.id;

        card.x = zone.x;
        card.y = zone.y + zone.h * 0.28;
        droppedInZone = true;
        break;
      }
    }

    if (!droppedInZone) {
      card.targetZoneId = null;
      card.x = card.homeX;
      card.y = card.homeY;
    }

    draggedCardIndex = -1;
  }
}

// ------------------------------------------
// 13. 檢查是否全部放置
// ------------------------------------------
function checkAllPlaced() {
  let placedCount = draggableCards.filter(c => c.targetZoneId !== null).length;
  submitBtn.visible = (placedCount === 6);
}

// ------------------------------------------
// 14. 繪製交卷按鈕
// ------------------------------------------
function drawSubmitButton() {
  push();
  rectMode(CENTER);

  let isHover = isInsideBtn(mouseX, mouseY, submitBtn);
  let scaleEffect = isHover ? 1.08 : 1 + sin(frameCount * 0.1) * 0.03;

  translate(submitBtn.x, submitBtn.y);
  scale(scaleEffect);

  fill(0, 0, 0, 20);
  rect(2, 4, submitBtn.w, submitBtn.h, 25);

  fill(70, 190, 90);
  stroke(255);
  strokeWeight(3);
  rect(0, 0, submitBtn.w, submitBtn.h, 25);

  fill(255);
  noStroke();
  textSize(17);
  textStyle(BOLD);
  text("📝 交卷看成績", 0, 0);

  pop();
}

function isInsideBtn(px, py, btn) {
  return (
    px > btn.x - btn.w / 2 &&
    px < btn.x + btn.w / 2 &&
    py > btn.y - btn.h / 2 &&
    py < btn.y + btn.h / 2
  );
}

// ------------------------------------------
// 15. 計算成績
// ------------------------------------------
function calculateScore() {
  timeSpent = totalTimeLimit - remainingTime;

  correctCount = 0;
  for (let zone of targetZones) {
    if (zone.occupiedByCardId === zone.id) {
      correctCount++;
    }
  }

  score = round((correctCount / quizData.length) * 100);

  if (gameState !== 'TIME_UP') {
    gameState = 'SUBMITTED';
  }

  if (score > 80) {
    createConfetti();
  }
}

// ------------------------------------------
// 16. 成績結算畫面 (依需求排版：按鈕在對錯清單上方)
// ------------------------------------------
function drawScoreScreen() {
  push();
  rectMode(CENTER);

  // 全螢幕半透明遮罩
  fill(255, 249, 230, 240);
  rect(width / 2, height / 2, width, height);

  // 計算卡片與頂端基準點
  let cardW = min(width * 0.92, 530);
  let cardH = min(height * 0.92, 580);
  let topY = height / 2 - cardH / 2;

  // 白色結果卡片主體
  fill(255);
  stroke(255, 180, 100);
  strokeWeight(4);
  rect(width / 2, height / 2, cardW, cardH, 25);

  // 1. 評語與標題
  noStroke();
  if (gameState === 'TIME_UP') {
    fill(230, 80, 80);
    textSize(min(22, cardW * 0.052));
    textStyle(BOLD);
    text("⏰ 時間到囉！努力完成了！", width / 2, topY + 35);
  } else if (score > 80) {
    fill(230, 80, 80);
    textSize(min(22, cardW * 0.052));
    textStyle(BOLD);
    text("🎉 太棒了！你是生活小達人！", width / 2, topY + 35);
  } else {
    fill(80, 120, 200);
    textSize(min(22, cardW * 0.052));
    textStyle(BOLD);
    text("💪 再接再厲！加油喔！", width / 2, topY + 35);
  }

  // 2. 顯示分數與用時
  fill(255, 110, 0);
  textSize(min(38, cardW * 0.085));
  textStyle(BOLD);
  text(`${score} 分`, width / 2 - 80, topY + 78);

  fill(80, 100, 120);
  textSize(min(14, cardW * 0.036));
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text(`答對題數：${correctCount} / 6 題`, width / 2 + 10, topY + 68);
  text(`⏱️ 作答用時：${timeSpent} 秒`, width / 2 + 10, topY + 88);

  // 3. 「再玩一次」按鈕 (放置於對錯清單上方)
  restartBtn.x = width / 2;
  restartBtn.y = topY + 132;
  restartBtn.w = 190;
  restartBtn.h = 42;
  restartBtn.visible = true;

  let isHover = isInsideBtn(mouseX, mouseY, restartBtn);

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  translate(restartBtn.x, restartBtn.y);
  if (isHover) scale(1.05);

  fill(255, 140, 50);
  stroke(255);
  strokeWeight(2);
  rect(0, 0, restartBtn.w, restartBtn.h, 21);

  fill(255);
  noStroke();
  textSize(16);
  textStyle(BOLD);
  text("🔄 再玩一次", 0, 0);
  pop();

  // 分隔線
  stroke(230);
  strokeWeight(1.5);
  line(width / 2 - cardW * 0.42, topY + 168, width / 2 + cardW * 0.42, topY + 168);

  // 4. 每題對錯明細清單 (位在按鈕正下方)
  let listStartY = topY + 188;
  let rowH = 36;

  textAlign(LEFT, CENTER);
  for (let i = 0; i < targetZones.length; i++) {
    let zone = targetZones[i];
    let userCard = draggableCards.find(c => c.id === zone.occupiedByCardId);
    let isCorrect = (zone.occupiedByCardId === zone.id);
    let currentY = listStartY + i * rowH;

    // 單列背景底板
    noStroke();
    fill(isCorrect ? color(235, 250, 235) : color(255, 240, 240));
    rectMode(CORNER);
    rect(width / 2 - cardW * 0.43, currentY - 13, cardW * 0.86, 30, 8);

    // 對錯標示
    textSize(13);
    textStyle(BOLD);
    if (isCorrect) {
      fill(40, 160, 60);
      text("🟢 答對", width / 2 - cardW * 0.40, currentY);
    } else {
      fill(220, 60, 60);
      text("🔴 答錯", width / 2 - cardW * 0.40, currentY);
    }

    // 題目圖解主題
    fill(60);
    textSize(12);
    textStyle(NORMAL);
    text(`【${zone.hint}】`, width / 2 - cardW * 0.23, currentY);

    // 填答與正解
    if (isCorrect) {
      fill(30, 130, 50);
      textStyle(BOLD);
      text(`${userCard ? userCard.text : ''}`, width / 2 + cardW * 0.05, currentY);
    } else {
      fill(200, 50, 50);
      let answerText = userCard ? `填: ${userCard.text}` : '未填寫';
      text(`${answerText} (正解:${zone.correctText})`, width / 2 - cardW * 0.02, currentY);
    }
  }

  rectMode(CENTER);
  pop();
}

// ------------------------------------------
// 17. 繽紛彩帶特效
// ------------------------------------------
function createConfetti() {
  confettiParticles = [];
  let colors = [
    color(255, 99, 132),
    color(54, 162, 235),
    color(255, 206, 86),
    color(75, 192, 192),
    color(153, 102, 255),
    color(255, 159, 64)
  ];

  for (let i = 0; i < 130; i++) {
    confettiParticles.push({
      x: random(width),
      y: random(-height * 0.5, 0),
      size: random(8, 14),
      color: random(colors),
      speedY: random(2, 6),
      speedX: random(-2, 2),
      rotation: random(TWO_PI),
      rotSpeed: random(-0.1, 0.1)
    });
  }
}

function updateAndDrawConfetti() {
  for (let p of confettiParticles) {
    p.y += p.speedY;
    p.x += p.speedX + sin(frameCount * 0.05);
    p.rotation += p.rotSpeed;

    if (p.y > height) {
      p.y = -20;
      p.x = random(width);
    }

    push();
    translate(p.x, p.y);
    rotate(p.rotation);
    fill(p.color);
    noStroke();
    rect(0, 0, p.size, p.size * 0.6);
    pop();
  }
}