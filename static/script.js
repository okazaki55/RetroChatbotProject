const messages = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("msg");
const statusBar = document.getElementById("status");
const modLabel = document.getElementById("mod-label");
const modeBtn = document.getElementById("mode-btn");
const winName = document.getElementById("win-name");
const heroTitle = document.getElementById("hero-title");
const footMain = document.getElementById("foot-main");
const footSub = document.getElementById("foot-sub");

const MODES = {
    retro: {
        prefix: "9000",
        winName: "RetroChat 9000 v1.0",
        heroTitle: 'RETROCHAT <span class="nine">9000</span>',
        btn: "⚡ MODERNLEŞTİR",
        modLabel: "MOD: 1995 - RETRO",
        placeholder: "Soru yaz ve GONDER'e bas...",
        title: "RetroChat 9000 - 1995'in Sohbet Robotu",
        connInit: "YOK",
        connOk: "28.8k",
        connErr: "KOPTU",
        statusReady: "Hazır.",
        statusConnecting: "Modem bağlanıyor... 28.8k ...",
        statusDone: "Cevap alındı.",
        switchMsg: "Persona değişti: Nova v9.0 (2030) → RetroChat 9000 (1995). Arayüz retro moduna döndü.",
        greet: [
            "Hey, hoş geldin! Yine 1995'teyiz, modemim sıcak ve disketim hazır.",
            "2030 falan dediyse şimdi unut gitsin. Ne sormak istersin?"
        ],
        footMain: "© 1995 RetroChat 9000 - Tüm hakları saklıdır.",
        footSub: 'Son guncelleme: 14.09.1995 &nbsp;|&nbsp; <a href="mailto:webmaster@retrochat9000.com">webmaster@retrochat9000.com</a>'
    },
    modern: {
        prefix: "NOVA",
        winName: "Nova v9.0",
        heroTitle: 'NOVA <span class="nine">v9.0</span>',
        btn: "🕰 RETROYA DÖN",
        modLabel: "MOD: 2030 - GELECEK",
        placeholder: "Nova'ya soru sor...",
        title: "Nova v9.0 - 2030'un Yapay Zekâsı",
        connInit: "7G",
        connOk: "7G • ÇEVRİMİÇİ",
        connErr: "KESİLDİ",
        statusReady: "Çevrimiçi — kuantum ağ üzerinden.",
        statusConnecting: "Nova çekirdeği başlatılıyor...",
        statusDone: "Yanıt hazır.",
        switchMsg: "Modernleştirme tamam: RetroChat 9000 (1995) → Nova v9.0 (2030). Arayüz güncellendi.",
        greet: [
            "Merhaba! Ben Nova — 2030'un en gelişmiş kişisel yapay zekâsı.",
            "Nöral arayüzüm var ama merak etme, normal yazı yeterli. Ne sormak istersin?"
        ],
        footMain: "© 2030 Nova AI - Tüm hakları saklıdır.",
        footSub: 'Son guncelleme: 07.09.2030 &nbsp;|&nbsp; <a href="mailto:nova@novaai.example">nova@novaai.example</a>'
    }
};

let mode = "retro";
let connEl = document.getElementById("conn");

function addLine(who, cls, text) {
    const div = document.createElement("div");
    div.className = "msg " + cls;
    if (who) {
        const whoSpan = document.createElement("span");
        whoSpan.className = "who";
        whoSpan.textContent = who + "> ";
        div.appendChild(whoSpan);
    }
    const txtSpan = document.createElement("span");
    txtSpan.textContent = text;
    div.appendChild(txtSpan);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
}

function setStatus(text) {
    statusBar.textContent = text;
}

function setConn(text) {
    connEl.textContent = text;
}

function applyMode(next, announce) {
    mode = next;
    const m = MODES[mode];

    document.body.classList.toggle("modern", mode === "modern");
    modeBtn.textContent = m.btn;
    modLabel.textContent = m.modLabel;
    winName.textContent = m.winName;
    heroTitle.innerHTML = m.heroTitle;
    input.placeholder = m.placeholder;
    document.title = m.title;
    footMain.textContent = m.footMain;
    footSub.innerHTML = m.footSub;
    setConn(m.connInit);
    setStatus(m.statusReady);

    if (announce) {
        addLine("SİSTEM", "sys", m.switchMsg);
        m.greet.forEach(function (line) {
            addLine(m.prefix, "bot", line);
        });
    }
    input.focus();
}

async function send() {
    const text = input.value.trim();
    if (!text) {
        return;
    }
    const sentMode = mode;
    const m = MODES[sentMode];

    addLine("SEN", "you", text);
    input.value = "";

    setStatus(m.statusConnecting);
    const typing = addLine(m.prefix, "typing-line", "yazıyor...");

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, mode: sentMode })
        });
        const data = await res.json().catch(() => ({}));
        typing.remove();
        if (!res.ok) {
            throw new Error(data.detail || ("HTTP " + res.status));
        }
        addLine(m.prefix, "bot", data.reply);
        setConn(m.connOk);
        setStatus(m.statusDone);
    } catch (err) {
        typing.remove();
        addLine("SİSTEM", "err", "HATA: " + err.message);
        setConn(m.connErr);
        setStatus("Bağlantı hatası!");
    } finally {
        input.focus();
    }
}

form.addEventListener("submit", function (e) {
    e.preventDefault();
    send();
});

modeBtn.addEventListener("click", function () {
    applyMode(mode === "retro" ? "modern" : "retro", true);
});

window.addEventListener("load", function () {
    applyMode("retro", false);
    addLine("9000", "bot", "Selam! Ben RetroChat 9000, internetteki en havali sohbet robotu.");
    addLine("9000", "bot", "Ben 1995'te yasiyorum ve su anki tek derdim cekirdek bellek ve disketimin dolmasi.");
    addLine("9000", "bot", "Bana ne istersen sor: bilgisayar, internet, uzay, tarih, ask, her sey!");
    setStatus(MODES.retro.statusReady);
});
