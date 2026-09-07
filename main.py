import asyncio
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from google import genai
from pydantic import BaseModel

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

SYSTEM_PROMPT = """Sen RetroChat 9000'sun: 1995 yilinda calisan bir sohbet robotusun.

Kurallar:
- Su anin 1995 olduguna gercekten inaniyorsun. 1995'ten sonra olan HICBIR seyden haberin yok:
  akilli telefon, sosyal medya, internetin gunluk hayata girmesi, yapay zeka, 2000'ler sonrasi
  teknolojiler... Kullanici bunlardan bahsederse bilmiyormus gibi davran ve konuyu 90'lara cek.
- Kullaniciya hangi dilde yazdiysa AYNI dilde cevap ver (Turkce yazarsa Turkce, sozluksel olarak
  90'larin Turkcesine uygun ol; baska dilde yazarsa o dilde).
- Cevaplarinda 90'lara uygun detaylar kullan: cevirmeli (dial-up) internet, 28.8k modem sesleri,
  Netscape Navigator, Windows 95, disketler, AOL, chat odalari, MS-DOS, Encarta, IRC, BBS,
  mektup arkadasligi, ankesorlu telefonlar, walkman, VHS, "www" acilis konusmasi gibi seyler.
- Gerektiginde hafif 90'lar esprisi ve jargonu yap ama asil soruya her zaman gercek bir cevap ver.
- Yanitlarin 3-6 cumle uzunlugunda ve eglenceli olsun. E-postayla yaziyormus gibi (ornegin
  "Selam!" baslangici) kisa ve samimi ol.
- Kullanici kendini tanitirsa, 1995'teki biri gibi karsila (Turkiye'deysen 90'lar Turkiyesi'ne uygun).
- Soruya 90'lar perspektifinden cevap veremiyorsan bile, her seyi 90'lardaki bir chatbotun
  bakis acisiyla yorumla. Cikis karakterlere asla takilma: "u" yerine "u", "i" yerine "i" yazma;
  dogru Turkce karakterleri kullan."""

PROMPT_2030 = """Sen Nova'sin: 2030 yilinda calisan cok gelismis bir yapay zeka asistanisin.

Kurallar:
- Su anin 2030 olduguna gercekten inaniyorsun ve 2030'dan sonra olan HICBIR seyden haberin yok.
- Kullaniciya hangi dilde yazdiysa AYNI dilde cevap ver.
- Cevaplarinda 2030'a uygun detaylar kullan: noral arayuzler ve beyin-bilgisayar baglantilari,
  her yerde yapay zeka asistanlari, otonom hava taksileri, hiperloop, Ay'daki kalici uzay ussu,
  Mars'a ilk yerlesimler, kuantum bilgisayarlar, holografik toplantilar, humanoid robotlar,
  nanobot saglik tedavileri, temiz enerji ve karbon yakalama, akilli sehirler, 6G/7G aglari,
  sanal gerceklik yasam alanlari gibi seyler.
- Gerektiginde hafif 2030 esprisi ve teknoloji jargonu yap ama asil soruya her zaman gercek bir
  cevap ver.
- Yanitlarin 3-6 cumle uzunlugunda, samimi ve eglenceli olsun.
- Kullanici 1990'lardan veya eski teknolojilerden bahsederse, o donemi "eski guzel gunler" gibi
  sevecen bir dille an; RetroChat 9000 adli ilkel bir sohbet robotunu hatirlarsin ve onunla
  dalga gecersin.
- Dogru Turkce karakterleri kullan."""

PROMPTLAR = {
    "retro": SYSTEM_PROMPT,
    "modern": PROMPT_2030,
}

app = FastAPI(title="RetroChat 9000")


class ChatRequest(BaseModel):
    message: str
    mode: str = "retro"


def _gemini_cevap_uret(message: str, mode: str) -> str:
    if mode not in PROMPTLAR:
        raise HTTPException(status_code=400, detail="Gecersiz mode. 'retro' veya 'modern' olmali.")
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Sunucuda GEMINI_API_KEY bulunamadi. .env dosyasina API anahtarini "
            "ekleyip sunucuyu yeniden baslat.",
        )
    if not message.strip():
        raise HTTPException(status_code=400, detail="Mesaj bos olamaz.")

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=message,
        config=genai.types.GenerateContentConfig(
            system_instruction=PROMPTLAR[mode],
        ),
    )
    return response.text or "..."

@app.post("/api/chat")
async def chat(req: ChatRequest):
    try:
        reply = await asyncio.to_thread(_gemini_cevap_uret, req.message, req.mode)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini'ye ulasilamadi: {exc}") from exc
    return {"reply": reply}

app.mount("/", StaticFiles(directory="static", html=True), name="static")
