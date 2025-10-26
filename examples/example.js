/**
 * HTML/CSS/JavaScript 統合サンプル
 */

// DOM要素の取得
const counterValue = document.getElementById('counter-value');
const incrementBtn = document.getElementById('increment-btn');
const decrementBtn = document.getElementById('decrement-btn');
const demoForm = document.getElementById('demo-form');
const formResult = document.getElementById('form-result');
const itemInput = document.getElementById('item-input');
const addItemBtn = document.getElementById('add-item-btn');
const itemList = document.getElementById('item-list');

// カウンターの状態
let counter = 0;

// カウンター機能
incrementBtn.addEventListener('click', () => {
    counter++;
    updateCounter();
});

decrementBtn.addEventListener('click', () => {
    counter--;
    updateCounter();
});

function updateCounter() {
    counterValue.textContent = counter;
    
    // アニメーション効果
    counterValue.style.transform = 'scale(1.2)';
    setTimeout(() => {
        counterValue.style.transform = 'scale(1)';
    }, 200);
}

// フォーム送信
demoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name-input').value;
    const email = document.getElementById('email-input').value;
    
    formResult.innerHTML = `
        <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <h4>✓ フォーム送信成功</h4>
            <p><strong>名前:</strong> ${name}</p>
            <p><strong>メール:</strong> ${email}</p>
        </div>
    `;
    
    // フォームをリセット
    demoForm.reset();
});

// 動的リスト
let items = [];

addItemBtn.addEventListener('click', () => {
    const itemText = itemInput.value.trim();
    
    if (itemText) {
        items.push({
            id: Date.now(),
            text: itemText
        });
        renderList();
        itemInput.value = '';
    }
});

itemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addItemBtn.click();
    }
});

function renderList() {
    itemList.innerHTML = items.map(item => `
        <li>
            <span>${item.text}</span>
            <button onclick="deleteItem(${item.id})">削除</button>
        </li>
    `).join('');
}

function deleteItem(id) {
    items = items.filter(item => item.id !== id);
    renderList();
}

// ページ読み込み時の初期化
console.log('🚀 HTML/CSS/JavaScript サンプルアプリケーションが初期化されました');
