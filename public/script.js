const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');

// Riwayat percakapan untuk konteks multi-turn chatbot
const conversationHistory = [];

// Konfigurasi Markdown (library marked)
if (window.marked) {
  marked.setOptions({
    breaks: true, // Ubah baris baru (\n) menjadi <br>
    gfm: true     // GitHub Flavored Markdown (tabel, list, kode, dsb)
  });
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1. Tampilkan pesan pengguna di chat
  appendMessage('user', userMessage);
  input.value = '';

  // Tambahkan ke riwayat percakapan
  conversationHistory.push({
    role: 'user',
    text: userMessage
  });

  // Kunci form selama proses respons
  setLoadingState(true);

  // 2. Tampilkan animasi loading logo ayam Aristo's
  const loadingElement = showLoadingIndicator();
  scrollToBottom();

  try {
    // 3. Request ke API backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation: conversationHistory })
    });

    const data = await response.json();

    // Hapus animasi loading
    loadingElement.remove();

    if (response.ok && data.result) {
      // 4. Render format markdown dari AI menjadi HTML terstruktur
      appendMessage('bot', data.result, true);

      // Simpan balasan bot ke riwayat
      conversationHistory.push({
        role: 'model',
        text: data.result
      });
    } else {
      appendMessage('bot', `⚠️ Mohon maaf, terjadi kendala: ${data.error || 'Gagal memproses respons.'}`);
    }
  } catch (error) {
    loadingElement.remove();
    appendMessage('bot', '⚠️ Gagal terhubung ke server Aristo\'s Chiken Meat. Pastikan server sudah berjalan.');
    console.error('Error saat mengirim pesan:', error);
  } finally {
    setLoadingState(false);
    scrollToBottom();
    input.focus();
  }
});

// Fungsi untuk menambahkan pesan ke antarmuka chat
function appendMessage(sender, text, isMarkdown = false) {
  const row = document.createElement('div');
  row.classList.add('message-row', sender === 'user' ? 'user-row' : 'bot-row');

  const avatar = document.createElement('div');
  avatar.classList.add('msg-avatar');

  if (sender === 'user') {
    avatar.textContent = '👤';
  } else {
    avatar.innerHTML = `
      <svg viewBox="0 0 100 100" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M44 20 C42 12, 50 8, 54 14 C58 9, 64 11, 65 17 C68 14, 74 16, 72 23 Z" fill="#e11d48"/>
        <path d="M42 30 C35 36, 31 48, 33 62 C36 74, 49 82, 63 80 C77 78, 85 66, 83 52 C81 42, 73 32, 63 28 Z" fill="#881337"/>
        <path d="M46 50 C44 60, 52 70, 62 68 C70 66, 72 56, 67 50 Z" fill="#be123c"/>
        <path d="M38 34 L24 38 L38 42 Z" fill="#f59e0b"/>
        <circle cx="48" cy="34" r="2.5" fill="#ffffff"/>
      </svg>
    `;
  }

  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  if (isMarkdown && window.marked) {
    // Konversi markdown ke format tampilan HTML yang rapi
    msg.innerHTML = marked.parse(text);
  } else {
    msg.textContent = text;
  }

  row.appendChild(avatar);
  row.appendChild(msg);
  chatBox.appendChild(row);
  scrollToBottom();
}

// Fungsi animasi loading logo ayam Aristo's
function showLoadingIndicator() {
  const row = document.createElement('div');
  row.classList.add('message-row', 'bot-row');
  row.id = 'loading-row';

  const avatar = document.createElement('div');
  avatar.classList.add('msg-avatar');
  avatar.innerHTML = `
    <svg viewBox="0 0 100 100" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 20 C42 12, 50 8, 54 14 C58 9, 64 11, 65 17 C68 14, 74 16, 72 23 Z" fill="#e11d48"/>
      <path d="M42 30 C35 36, 31 48, 33 62 C36 74, 49 82, 63 80 C77 78, 85 66, 83 52 C81 42, 73 32, 63 28 Z" fill="#881337"/>
      <path d="M46 50 C44 60, 52 70, 62 68 C70 66, 72 56, 67 50 Z" fill="#be123c"/>
      <path d="M38 34 L24 38 L38 42 Z" fill="#f59e0b"/>
      <circle cx="48" cy="34" r="2.5" fill="#ffffff"/>
    </svg>
  `;

  const loaderCard = document.createElement('div');
  loaderCard.classList.add('chicken-loading-card');
  loaderCard.innerHTML = `
    <div class="chicken-badge-pulse">
      <!-- Logo Ayam Animasi (Patuk & Kepak Sayap) -->
      <svg class="chicken-anim-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M44 20 C42 12, 50 8, 54 14 C58 9, 64 11, 65 17 C68 14, 74 16, 72 23 Z" fill="#e11d48"/>
        <path d="M42 30 C35 36, 31 48, 33 62 C36 74, 49 82, 63 80 C77 78, 85 66, 83 52 C81 42, 73 32, 63 28 Z" fill="#881337"/>
        <path class="chicken-anim-wing" d="M46 50 C44 60, 52 70, 62 68 C70 66, 72 56, 67 50 Z" fill="#be123c"/>
        <path d="M38 34 L24 38 L38 42 Z" fill="#f59e0b"/>
        <path d="M38 42 C36 48, 40 52, 42 48 C43 44, 40 42, 38 42 Z" fill="#e11d48"/>
        <circle cx="48" cy="34" r="2.5" fill="#ffffff"/>
      </svg>
    </div>
    <div class="chicken-loading-text">
      <span class="chicken-loading-label">Aristo's Chiken Meat</span>
      <span class="chicken-loading-sub">
        Menyiapkan jawaban
        <span class="loading-dots-burgundy">
          <span></span><span></span><span></span>
        </span>
      </span>
    </div>
  `;

  row.appendChild(avatar);
  row.appendChild(loaderCard);
  chatBox.appendChild(row);

  return row;
}

// Kontrol status disable saat proses respon
function setLoadingState(isLoading) {
  input.disabled = isLoading;
  sendBtn.disabled = isLoading;
}

// Scroll otomatis ke bawah
function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}
